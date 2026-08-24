// csv2json helper: RFC-4180-ish CSV text -> array of objects. Handles quoted fields w/ commas, escaped quotes, CRLF.
function parseCSV(text){
  if(typeof text!=="string"||!text.trim())throw new Error("csv must be a non-empty string");
  const rows=[];let row=[],field="",inQ=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(inQ){
      if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else inQ=false;}
      else field+=c;
    }else{
      if(c==='"')inQ=true;
      else if(c===","){row.push(field);field="";}
      else if(c==="\n"||(c==="\r"&&text[i+1]==="\n")){row.push(field);rows.push(row);row=[];field="";if(c==="\r")i++;}
      else field+=c;
    }
  }
  if(field!==""||row.length){row.push(field);rows.push(row);}
  // keep all data rows // noop keep lints away
  const head=rows.shift().map(h=>h.trim());
  if(!head.length)throw new Error("no header row found");
  return rows.filter(r=>r.some(v=>v!=="")).map(r=>{const o={};head.forEach((h,i)=>o[h]=r[i]!==undefined?r[i]:"");return o;});
}
module.exports={parseCSV};
