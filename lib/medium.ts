export function localizeMedium(value:string|undefined|null, locale:"ru"|"en"="en"){
 const raw=(value||"").trim();
 if(!raw) return "—";
 const key=raw.toLowerCase().replace(/[–—]/g,"-").replace(/\s+/g," ");
 const map:Record<string,{ru:string;en:string}>={
  "масло на холсте":{ru:"Масло на холсте",en:"Oil on canvas"},
  "масло на дереве":{ru:"Масло на дереве",en:"Oil on wood"},
  "масло на бумаге":{ru:"Масло на бумаге",en:"Oil on paper"},
  "акрил на холсте":{ru:"Акрил на холсте",en:"Acrylic on canvas"},
  "акрил на бумаге":{ru:"Акрил на бумаге",en:"Acrylic on paper"},
  "смешанная техника":{ru:"Смешанная техника",en:"Mixed media"},
  "смешанная техника на холсте":{ru:"Смешанная техника на холсте",en:"Mixed media on canvas"},
  "масло и акрил на холсте":{ru:"Масло и акрил на холсте",en:"Oil and acrylic on canvas"},
  "акрил и масло на холсте":{ru:"Акрил и масло на холсте",en:"Acrylic and oil on canvas"},
  "гуашь на бумаге":{ru:"Гуашь на бумаге",en:"Gouache on paper"},
  "акварель на бумаге":{ru:"Акварель на бумаге",en:"Watercolour on paper"},
  "пастель на бумаге":{ru:"Пастель на бумаге",en:"Pastel on paper"},
  "уголь на бумаге":{ru:"Уголь на бумаге",en:"Charcoal on paper"},
  "графит на бумаге":{ru:"Графит на бумаге",en:"Graphite on paper"},
  "чернила на бумаге":{ru:"Чернила на бумаге",en:"Ink on paper"},
  "темпера на холсте":{ru:"Темпера на холсте",en:"Tempera on canvas"},
  "темпера на бумаге":{ru:"Темпера на бумаге",en:"Tempera on paper"}
 };
 const item=map[key];
 if(item) return item[locale];
 // Also accept common English input and show its Russian equivalent.
 const reverse=Object.values(map).find(item=>item.en.toLowerCase()===key);
 if(reverse) return reverse[locale];
 return raw;
}
