# Arnés de Sendero del Código: corre el programa del jugador y las pruebas ocultas de un ejercicio.
# Lo carga el worker de Pyodide (js/py-worker.js) y también herramientas/verificar.py con CPython,
# así las soluciones se verifican exactamente igual que en el navegador.
import builtins, io, json, os, random, sys, tempfile, traceback, types

ARCHIVO = '<jugador>'
MAX_SALIDA = 20000
_DATOS = {}          # archivos que están en todas las carpetas de trabajo (versiculos.json)
_CARPETA_BASE = os.getcwd()
_MODULOS_PROPIOS = set()


def datos_comunes(archivos_json):
    """Archivos que cada programa encuentra en su carpeta, p. ej. {"versiculos.json": "..."}."""
    _DATOS.clear()
    _DATOS.update(json.loads(archivos_json))


class _PideEntrada(BaseException):
    """El programa llamó a input() y ya no quedan entradas: la interfaz pide una y vuelve a correrlo."""
    def __init__(self, mensaje):
        self.mensaje = mensaje


class _Salida(io.StringIO):
    def write(self, s):
        if self.tell() > MAX_SALIDA:
            raise RuntimeError('salida-demasiado-larga')
        return super().write(s)


# ── lienzo: dibujar desde Python. Guarda las órdenes y la página las pinta en un <canvas>. ─────────────────────
def _crear_lienzo():
    m = types.ModuleType('lienzo')
    m.__doc__ = 'Dibuja formas y texto en el lienzo de la página. Coordenadas en píxeles; (0, 0) es la esquina de arriba a la izquierda.'
    m._ordenes = []
    m._tam = [400, 300]

    def tamano(ancho, alto):
        m._tam[:] = [int(ancho), int(alto)]

    def _orden(tipo, **d):
        d['tipo'] = tipo
        m._ordenes.append(d)
        if len(m._ordenes) > 5000:
            raise RuntimeError('salida-demasiado-larga')

    def fondo(color):
        _orden('fondo', color=str(color))

    def rectangulo(x, y, ancho, alto, color='black', borde=None):
        _orden('rect', x=float(x), y=float(y), w=float(ancho), h=float(alto), color=str(color), borde=borde and str(borde))

    def circulo(x, y, radio, color='black', borde=None):
        _orden('circulo', x=float(x), y=float(y), r=float(radio), color=str(color), borde=borde and str(borde))

    def linea(x1, y1, x2, y2, color='black', grosor=2):
        _orden('linea', x1=float(x1), y1=float(y1), x2=float(x2), y2=float(y2), color=str(color), grosor=float(grosor))

    def texto(x, y, contenido, color='black', tamano=20, centrado=False):
        _orden('texto', x=float(x), y=float(y), texto=str(contenido), color=str(color), tam=float(tamano), centrado=bool(centrado))

    for nombre, f in (('tamano', tamano), ('fondo', fondo), ('rectangulo', rectangulo), ('circulo', circulo),
                      ('linea', linea), ('texto', texto),
                      ('size', tamano), ('background', fondo), ('rectangle', rectangulo), ('circle', circulo),
                      ('line', linea), ('text', texto)):
        setattr(m, nombre, f)
    return m


def _info_error(e, codigo):
    lineas = codigo.split('\n')
    linea = None
    if isinstance(e, SyntaxError) and e.filename == ARCHIVO:
        linea = e.lineno
    else:
        for f in traceback.extract_tb(e.__traceback__):
            if f.filename == ARCHIVO:
                linea = f.lineno
    texto = lineas[linea - 1] if linea and 0 < linea <= len(lineas) else ''
    mensaje = e.msg if isinstance(e, SyntaxError) else str(e)
    return {'tipo': type(e).__name__, 'mensaje': mensaje, 'linea': linea, 'texto': texto}


def _preparar_carpeta(archivos):
    """Carpeta de trabajo nueva para cada ejecución, con los datos comunes y los archivos del ejercicio."""
    carpeta = tempfile.mkdtemp(prefix='sendero-')
    for nombre, contenido in {**_DATOS, **(archivos or {})}.items():
        ruta = os.path.join(carpeta, nombre)
        os.makedirs(os.path.dirname(ruta), exist_ok=True)
        with open(ruta, 'w', encoding='utf-8') as f:
            f.write(contenido)
    # los módulos propios (.py del ejercicio) se vuelven a importar en cada ejecución
    for nombre in list(_MODULOS_PROPIOS) + [n[:-3] for n in (archivos or {}) if n.endswith('.py')]:
        sys.modules.pop(nombre, None)
    _MODULOS_PROPIOS.update(n[:-3] for n in (archivos or {}) if n.endswith('.py'))
    os.chdir(carpeta)
    sys.path.insert(0, carpeta)
    return carpeta


def _correr(codigo, entradas, semilla, espacio):
    """Ejecuta el código del jugador. Devuelve (salida, error, pide_entrada)."""
    cola = list(entradas)
    salida = _Salida()

    def entrada(mensaje=''):
        salida.write(str(mensaje))
        if not cola:
            raise _PideEntrada(str(mensaje))
        valor = str(cola.pop(0))
        salida.write(valor + '\n')
        return valor

    espacio.update({'__name__': '__main__', '__builtins__': builtins})
    viejo_input = builtins.input
    builtins.input = entrada          # también lo usan los módulos propios que importe el jugador
    random.seed(semilla)
    viejo = sys.stdout
    sys.stdout = salida
    error = pide = None
    try:
        exec(compile(codigo, ARCHIVO, 'exec'), espacio)
    except _PideEntrada as p:
        pide = p.mensaje
    except RuntimeError as e:
        if str(e) == 'salida-demasiado-larga':
            error = {'tipo': 'SalidaLarga', 'mensaje': '', 'linea': None, 'texto': ''}
        else:
            error = _info_error(e, codigo)
    except Exception as e:
        error = _info_error(e, codigo)
    except SystemExit:
        pass
    finally:
        sys.stdout = viejo
        builtins.input = viejo_input
    return salida.getvalue(), error, pide


def _normalizar(t):
    return '\n'.join(l.rstrip() for l in t.replace('\r', '').strip('\n').split('\n'))


def ejecutar(peticion_json):
    """peticion: {codigo, entradas, semilla, pruebas|null, archivos}. Devuelve JSON con salida, error,
    pide_entrada, dibujo (si usó lienzo) y resultados de las pruebas (lista de {ok, msg})."""
    p = json.loads(peticion_json)
    codigo = p['codigo']
    espacio = {}
    lienzo = _crear_lienzo()
    sys.modules['lienzo'] = lienzo
    carpeta = _preparar_carpeta(p.get('archivos'))
    try:
        salida, error, pide = _correr(codigo, p.get('entradas') or [], p.get('semilla', 7), espacio)
        r = {'salida': salida, 'error': error, 'pide_entrada': pide, 'pruebas': None,
             'dibujo': {'ancho': lienzo._tam[0], 'alto': lienzo._tam[1], 'ordenes': lienzo._ordenes} if lienzo._ordenes else None}
        pruebas = p.get('pruebas')
        if pruebas is None or error or pide is not None:
            return json.dumps(r)
        resultados = []
        for prueba in pruebas:
            if 'salida' in prueba:
                esperada = _normalizar(prueba['salida'])
                obtenida = _normalizar(salida)
                resultados.append({'ok': esperada == obtenida, 'msg': prueba.get('msg') or 'salida-distinta',
                                   'esperada': esperada, 'obtenida': obtenida})
            elif 'py' in prueba:
                ctx = dict(espacio)
                ctx.update({'_salida': salida, '_codigo': codigo, '_lineas': codigo.split('\n'),
                            '_dibujo': lienzo._ordenes, '_correr': _correr_otra_vez(codigo)})
                viejo = sys.stdout
                sys.stdout = io.StringIO()   # lo que impriman las funciones del jugador durante la prueba no cuenta
                try:
                    exec(prueba['py'], ctx)
                    resultados.append({'ok': True, 'msg': prueba.get('msg')})
                except AssertionError:
                    resultados.append({'ok': False, 'msg': prueba.get('msg') or 'prueba-fallida'})
                except Exception as e:
                    resultados.append({'ok': False, 'msg': prueba.get('msg') or 'prueba-fallida',
                                       'detalle': type(e).__name__ + ': ' + str(e)})
                finally:
                    sys.stdout = viejo
        r['pruebas'] = resultados
        return json.dumps(r)
    finally:
        os.chdir(_CARPETA_BASE)
        if carpeta in sys.path:
            sys.path.remove(carpeta)


def _correr_otra_vez(codigo):
    """Para pruebas con varias entradas: _correr(['Ana']) vuelve a correr el programa y devuelve su salida."""
    def correr(entradas, semilla=7):
        salida, error, pide = _correr(codigo, entradas, semilla, {})
        if error:
            raise AssertionError(error['tipo'])
        if pide is not None:
            raise AssertionError('faltan entradas')
        return salida
    return correr
