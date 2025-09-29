export interface AnalyticsProvider { name: string; buildUrl: (opts:Record<string,string>)=>string; }
export const IframeProvider=(baseUrl:string):AnalyticsProvider=>({ name:"iframe", buildUrl:(opts)=>{
  const q=new URLSearchParams(opts).toString(); return q? `${baseUrl}?${q}`: baseUrl;
}});
