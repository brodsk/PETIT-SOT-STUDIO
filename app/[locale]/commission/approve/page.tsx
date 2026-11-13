import CommissionApproval from "./CommissionApproval";
export const dynamic="force-dynamic";
export const metadata={title:"Review your painting proposal | PETIT.SOT STUDIO",robots:{index:false,follow:false}};
export default async function CommissionApprovalPage({searchParams}:{searchParams:Promise<{ref?:string;token?:string}>}){const p=await searchParams;return <CommissionApproval reference={String(p.ref||"")} token={String(p.token||"")}/>;}
