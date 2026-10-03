export const homepageSections = [
 {id:'hero',name:'Homepage cover'},
 {id:'values',name:'Club values'},
 {id:'about',name:'Our club'},
 {id:'mantra',name:'Play. Learn. Belong. banner'},
 {id:'programmes',name:'Find their team'},
 {id:'gallery',name:'Life at the club / gallery'},
 {id:'news',name:'Club news'},
 {id:'fixtures',name:'Fixtures and results'},
 {id:'squad',name:'Squad'},
 {id:'staff',name:'Staff'},
 {id:'standings',name:'Standings'},
 {id:'honours',name:'Honours'},
 {id:'join',name:'Join / contact the club'},
] as const;
export type SectionId=typeof homepageSections[number]['id'];
export type SectionVisibility=Partial<Record<SectionId,boolean>>;
export function sectionVisible(content:{sections?:SectionVisibility},id:SectionId){return content.sections?.[id]!==false;}
