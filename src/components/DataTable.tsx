"use client";
import { FC } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
type Row={ reg:string; entity:string; status:string; avail:string; downtime:string; util:string };
type Props={ rows: Row[] };
const DataTable: FC<Props> = ({ rows }) => {
  const columns=[
    { headerName:"Reg", field:"reg" },
    { headerName:"Entity", field:"entity" },
    { headerName:"Status", field:"status" },
    { headerName:"Avail", field:"avail" },
    { headerName:"Downtime", field:"downtime" },
    { headerName:"Util (km/mo)", field:"util" }
  ];
  return (<div className="ag-theme-alpine" style={{height: 300, width: "100%"}}><AgGridReact rowData={rows} columnDefs={columns as any} /></div>);
};
export default DataTable;
