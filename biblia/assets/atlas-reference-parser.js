(function(root){
  'use strict';

  const BOOKS = [
    ['Genesis','GEN'],['Exodus','EXO'],['Leviticus','LEV'],['Numbers','NUM'],['Deuteronomy','DEU'],
    ['Joshua','JOS'],['Judges','JDG'],['Ruth','RUT'],['1 Samuel','1SA'],['2 Samuel','2SA'],
    ['1 Kings','1KI'],['2 Kings','2KI'],['1 Chronicles','1CH'],['2 Chronicles','2CH'],['Ezra','EZR'],
    ['Nehemiah','NEH'],['Esther','EST'],['Job','JOB'],['Psalms','PSA'],['Proverbs','PRO'],
    ['Ecclesiastes','ECC'],['Song of Solomon','SNG'],['Isaiah','ISA'],['Jeremiah','JER'],['Lamentations','LAM'],
    ['Ezekiel','EZK'],['Daniel','DAN'],['Hosea','HOS'],['Joel','JOL'],['Amos','AMO'],
    ['Obadiah','OBA'],['Jonah','JON'],['Micah','MIC'],['Nahum','NAM'],['Habakkuk','HAB'],
    ['Zephaniah','ZEP'],['Haggai','HAG'],['Zechariah','ZEC'],['Malachi','MAL'],['Matthew','MAT'],
    ['Mark','MRK'],['Luke','LUK'],['John','JHN'],['Acts','ACT'],['Romans','ROM'],
    ['1 Corinthians','1CO'],['2 Corinthians','2CO'],['Galatians','GAL'],['Ephesians','EPH'],['Philippians','PHP'],
    ['Colossians','COL'],['1 Thessalonians','1TH'],['2 Thessalonians','2TH'],['1 Timothy','1TI'],['2 Timothy','2TI'],
    ['Titus','TIT'],['Philemon','PHM'],['Hebrews','HEB'],['James','JAS'],['1 Peter','1PE'],
    ['2 Peter','2PE'],['1 John','1JN'],['2 John','2JN'],['3 John','3JN'],['Jude','JUD'],['Revelation','REV']
  ];
  const BY_NAME = new Map(BOOKS.map(([name,id],index)=>[name.toLowerCase(),{name,id,index}]));
  const ENDPOINT = /^((?:[1-3]\s+)?[A-Za-z]+(?:\s+of\s+[A-Za-z]+)*)(?:\s+(\d+)(?::(\d+))?)?$/;

  function parseEndpoint(value){
    const match=String(value||'').trim().match(ENDPOINT);
    if(!match) return null;
    const book=BY_NAME.get(match[1].toLowerCase());
    const chapter=match[2] ? Number(match[2]) : null;
    const verse=match[3] ? Number(match[3]) : null;
    if(!book || (chapter!==null && (!Number.isInteger(chapter)||chapter<1)) ||
       (verse!==null && (!Number.isInteger(verse)||verse<1))) return null;
    return {...book,chapter,verse};
  }

  function parse(reference){
    const normalized=String(reference||'').trim().replace(/[—–]/g,'-').replace(/\s*-\s*/g,'-');
    if(!normalized) return null;
    const direct=parseEndpoint(normalized);
    if(direct && direct.chapter!==null) return {reference:String(reference).trim(),start:direct,end:{...direct}};

    for(let index=normalized.indexOf('-'); index!==-1; index=normalized.indexOf('-',index+1)){
      const left=parseEndpoint(normalized.slice(0,index));
      if(!left) continue;
      const rightRaw=normalized.slice(index+1);
      let right=parseEndpoint(rightRaw);
      if(!right){
        const short=rightRaw.match(/^(\d+)(?::(\d+))?$/);
        if(short){
          const first=Number(short[1]);
          const second=short[2] ? Number(short[2]) : null;
          right=second!==null
            ? {...left,chapter:first,verse:second}
            : left.verse!==null && first>=left.verse
              ? {...left,verse:first}
              : left.verse!==null
                ? {...left,chapter:first,verse:null}
              : {...left,chapter:first,verse:null};
        }
      }
      if(!right) continue;
      if(left.chapter===null) left.chapter=1;
      const startOrder=[left.index,left.chapter,left.verse||0];
      const endOrder=[right.index,right.chapter||Number.MAX_SAFE_INTEGER,right.verse||Number.MAX_SAFE_INTEGER];
      if(startOrder[0]>endOrder[0] || (startOrder[0]===endOrder[0] && startOrder[1]>endOrder[1]) ||
         (startOrder[0]===endOrder[0] && startOrder[1]===endOrder[1] && startOrder[2]>endOrder[2])) return null;
      return {reference:String(reference).trim(),start:left,end:right};
    }
    return null;
  }

  root.VerboAtlasReferenceParser={BOOKS,parse};
})(typeof window!=='undefined'?window:globalThis);
