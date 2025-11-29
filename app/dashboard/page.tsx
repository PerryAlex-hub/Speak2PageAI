import getDbConnection from "@/lib/db";


const Dashboard = async () => {
  const sql = await getDbConnection();
   const response = await sql`SELECT version()`;
  return <div>Dashboard {response[0].version}</div>;
}

export default Dashboard