"use client"
import { useEffect, useState } from "react";

type Question = {
  id: string;
  question: string;
  cat: string;
  type: string[];
  ans: {
    [key: string]: number;
  };
};

export default function Page() {
  const [tJson, setTJson] = useState<Question[]>([])
  const [question,setQuestion] = useState<Question[]>([]);
  const [cat, setCat] = useState<string[]>([]);

  const [tempCat, setTempCat] = useState(0);
  const [QtNum, setQtNum] = useState(0);

  useEffect(()=>{
    async function load(){
      const res = await fetch("/api/prsnasmt");
      const json = await res.json();
      setTJson(json);
      setQuestion(json);

      setCat([...new Set(json.map((item: any) => item.cat))] as string[]);
    }
    load();
  },[])

  let i=0;
  for(let item of cat){
    console.log(item)
    console.log(i);
    i++;
  }



  return (
    <div className="flex flex-col gap-10 static bg-[#FAF7F0] min-h-screen items-center ">
      {cat.map((categoryName, i) => i === tempCat && (
        <div>
          <div className="flex flex-col bg-black w-[100%] h-[10vh]  mt-[5vh] items-center">
            <div className="flex justify-between w-[100%] h-[90%] items-center">
              {cat.map((categoryName, i)=> (
                <div key={i}>{categoryName}</div>
              ))}
            </div>
            <div className="bg-red-300 w-[100%] h-[5px]"></div>
          </div>

          <div className=" bg-red-500 w-[80vw] h-[20vh] mt-[10vh]">
            <p>question</p>
            {tJson.map((ques, i) => ques.cat === categoryName && i === QtNum &&(
              <div>
                <p>{ques.question}</p>
                {Object.entries(ques.ans).map(([key,value]) => (
                  // <p key={key}>{key}</p>
                  <button key={key} className="bg-white font-black text-black w-[100%] text-[18px] px-[1.3em] py-[0.6em] border-[3px] border-black rounded-[0.4em] shadow-[0.1em_0.1em_0_0_black] cursor-pointer transition-transform hover:-translate-x-[0.05em] hover:-translate-y-[0.05em] hover:shadow-[0.15em_0.15em_0_0_black] active:translate-x-[0.05em] active:translate-y-[0.05em] active:shadow-[0.05em_0.05em_0_0_black]">{key}</button>
                ))}
              </div>
            ))}
          </div>
        </div>

          
      ))}  
    </div>
    
    
    // <div className="flex flex-col gap-10 static bg-[#FAF7F0] min-h-screen items-center ">

    //     <div className="flex flex-col bg-black w-[80vw] h-[10vh]  mt-[5vh] items-center">
    //         {/* <p>{JSON.stringify(question)}</p> */}
    //         <div className="flex justify-between bg-blue-500 w-[100%] h-[50%] item-center">
    //           {cat.map((categoryName, i) => (
    //             <div key={i}>{categoryName}</div>
    //           ))}
    //         </div>

    //         <div className="bg-blue-300 w-[80%] h-[5px]">
    //         </div>
    //     </div>

    //     <div className=" bg-red-500 w-[80vw] h-[20vh] mt-[10vh]">
    //         <p>hello</p>
    //     </div>
    // </div>
  );
}



//use client csr tempdata:usestate, usesession, localstorage, cookie(1.nomal 2.httpOnly)

//ssr

//!!!!!!!!!!!!!!!!!
//redirec ใช้เป็น  taglink เท่านั้น