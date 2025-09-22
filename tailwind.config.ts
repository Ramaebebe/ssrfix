import type { Config } from "tailwindcss";
export default {
  content:["./src/**/*.{ts,tsx}"],
  theme:{extend:{
    colors:{brand:{DEFAULT:"#EC6425",50:"#FFF2EB",100:"#FFE4D6",200:"#FFC2A8",300:"#FF9F79",400:"#FF7D4B",500:"#EC6425",600:"#C7511E",700:"#A13F18",800:"#7B2D12",900:"#561B0C"}},
    boxShadow:{soft:"0 10px 25px rgba(0,0,0,0.08)",xlsoft:"0 30px 60px rgba(0,0,0,0.25)"},
    borderRadius:{"2xl":"1rem","3xl":"1.5rem"}
  }},
  plugins:[]
} satisfies Config;
