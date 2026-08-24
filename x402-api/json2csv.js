// json2csv helper: array of flat objects -> CSV string. Nested values are JSON-stringified.
function toCSV(rows){
  if(!Array.isArray(rows)||!rows.length)throw new Error("body must be a non-empty JSON array of objects");
  const cols=[...new Set(rows.flatMap(r=>Object.keys(typeof r==="object"&&r!==null?r:{})))];
  if(!cols.length)throw new Error("no columns found");
  const esc=v=>{if(v===null||v===undefined)return"";const s=typeof v==="object"?JSON.stringify(v):String(v);return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
  const head=cols.join(",");
  const body=rows.map(r=>cols.map(c=>esc(r[c])).join(",")).join("\n");
  return head+"\n"+body;
}
module.exports={toCSV};
