# Utley Commentary

English Bible commentary by Dr. Bob Utley, adapted from the digitized HTML
edition published by Bible Lessons International at
https://www.freebiblecommentary.org/.

## Permission and attribution

Copyright © Bible Lessons International. All rights reserved. The publisher
permits copies and distribution of any part only when they are made available
at no cost, give credit to Dr. Bob Utley, and include a reference to
https://www.freebiblecommentary.org/.

Verbo exposes this module without charge and preserves the author, source URL,
copyright notice, and permission condition in its manifest. Embedded NASB text
boxes are omitted by the importer; the commentary's short translation
comparisons and quotations remain part of the authored work and retain the
publisher's notices.

## Rebuilding

```sh
python3 tools/import_freebiblecommentary.py
python3 tools/build_commentary_index.py
python3 tools/build_registry_catalog.py
```

Downloaded source pages are cached under `/tmp/freebiblecommentary-cache` and
are not committed. The generated module is English; Verbo's existing
translation-on-demand API handles translated display.
