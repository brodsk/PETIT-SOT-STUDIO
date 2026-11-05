export function localizeMedium(value:string|undefined|null, locale:"ru"|"en"="en"){
 const raw=(value||"").trim();
 if(!raw) return "—";
 const key=raw.toLowerCase().replace(/[–—]/g,"-").replace(/\\s+/g," ").replace(/[ё]/g,"е");
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
  "акварель на акварельной бумаге":{ru:"Акварель на акварельной бумаге",en:"Watercolour on watercolour paper"},
  "акварель на бумаге для акварели":{ru:"Акварель на бумаге для акварели",en:"Watercolour on watercolour paper"},
  "пастель на бумаге":{ru:"Пастель на бумаге",en:"Pastel on paper"},
  "уголь на бумаге":{ru:"Уголь на бумаге",en:"Charcoal on paper"},
  "графит на бумаге":{ru:"Графит на бумаге",en:"Graphite on paper"},
  "чернила на бумаге":{ru:"Чернила на бумаге",en:"Ink on paper"},
  "темпера на холсте":{ru:"Темпера на холсте",en:"Tempera on canvas"},
  "темпера на бумаге":{ru:"Темпера на бумаге",en:"Tempera on paper"},
  "масляная живопись на холсте":{ru:"Масляная живопись на холсте",en:"Oil painting on canvas"},
  "акриловая живопись на холсте":{ru:"Акриловая живопись на холсте",en:"Acrylic painting on canvas"}
 };
 const item=map[key];
 if(item) return item[locale];
 // Also accept common English input and show its Russian equivalent.
 const reverse=Object.values(map).find(item=>item.en.toLowerCase()===key);
 if(reverse) return reverse[locale];
 // Handle common Russian medium + surface combinations not listed verbatim above.
 if(locale==="en"){
  const media:[RegExp,string][]=[
   [/^масло(?:вые краски|вая живопись)?$/,"Oil"],
   [/^акрил(?:овые краски|овая живопись)?$/,"Acrylic"],
   [/^акварель(?:ная живопись)?$/,"Watercolour"],
   [/^гуашь$/,"Gouache"],
   [/^пастель$/,"Pastel"],
   [/^уголь$/,"Charcoal"],
   [/^графит$/,"Graphite"],
   [/^чернила$/,"Ink"],
   [/^темпера$/,"Tempera"],
   [/^смешанная техника$/,"Mixed media"]
  ];
  const surfaces:[RegExp,string][]=[
   [/^холст(?:е)?$/,"canvas"],
   [/^льняном холст(?:е)?$/,"linen canvas"],
   [/^хлопковом холст(?:е)?$/,"cotton canvas"],
   [/^бумаг(?:а|е)$/,"paper"],
   [/^акварельной бумаг(?:е|а)$/,"watercolour paper"],
   [/^бумаге для акварели$/,"watercolour paper"],
   [/^дерев(?:е|у)$/,"wood"],
   [/^картон(?:е)?$/,"cardboard"],
   [/^панел(?:и|ь)$/,"panel"]
  ];
  const match=key.match(/^(.+?)\\s+на\\s+(.+)$/);
  if(match){
   const medium=media.find(([pattern])=>pattern.test(match[1]));
   const surface=surfaces.find(([pattern])=>pattern.test(match[2]));
   if(medium&&surface) return medium[1]+" on "+surface[1];
  }
 }
 return raw;
}
