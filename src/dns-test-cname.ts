import dns from "dns";
import { promisify } from "util";

const resolveCname = promisify(dns.resolveCname);

async function test() {
  const host = "db.hdmuzwcnthsbamrwzjsd.supabase.co";
  console.log("Resolving CNAME for:", host);
  try {
    const cnames = await resolveCname(host);
    console.log("CNAMEs:", cnames);
  } catch (err: any) {
    console.error("CNAME Resolution Failed:", err.message);
  }
}

test();
