import Link from "next/link";
import { fetchOrderBook, getMidPrice } from "@/lib/stellar";
import { supabase } from "@/lib/supabase";

async function getLiveData() {
  let midPrice: string | null = null;
  try {
    const ob = await fetchOrderBook(5);
    midPrice = getMidPrice(ob);
  } catch { /* ignore */ }

  const [projectsRes, campaignsRes, competitionsRes] = await Promise.all([
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("campaigns").select("id", { count: "exact", head: true }),
    supabase.from("competitions").select("id", { count: "exact", head: true }),
  ]);

  return {
    midPrice,
    projectCount: projectsRes.count ?? 0,
    campaignCount: campaignsRes.count ?? 0,
    competitionCount: competitionsRes.count ?? 0,
  };
}

export default async function HomePage() {
  const { midPrice, projectCount, campaignCount, competitionCount } = await getLiveData();

  return (
    <div style={{ backgroundColor: "#000", minHeight: "100vh", color: "#fff", overflowX: "hidden" }}>
      <style dangerouslySetInnerHTML={{__html: `
        .nav-link { color: #A1A1AA; text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; }
        .nav-link:hover { color: #fff !important; }
        .hero-btn:hover { transform: scale(1.05); }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
      `}} />
      {/* ── Top Navigation ── */}
      <nav
        style={{
          position: "fixed",
          top: "24px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "90%",
          maxWidth: "1200px",
          background: "rgba(10, 10, 10, 0.6)",
          backdropFilter: "blur(12px)",
          border: "1px solid #2C2C2C",
          borderRadius: "70px",
          padding: "12px 24px",
          zIndex: 1000,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <div style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.04em", color: "#fff" }}>
            ZING
          </div>
          <div style={{ display: "flex", gap: "24px" }}>
            <Link href="#ecosystem" className="nav-link">Ecosystem</Link>
            <Link href="#stats" className="nav-link">Live Stats</Link>
            <Link href="#agents" className="nav-link">AI Agents</Link>
          </div>
        </div>

        <Link
          href="/dashboard"
          style={{
            background: "#fff",
            color: "#000",
            padding: "10px 24px",
            borderRadius: "900px",
            fontSize: "14px",
            fontWeight: 700,
            textDecoration: "none",
            transition: "all 0.2s",
          }}
        >
          Launch App
        </Link>
      </nav>

      {/* ── Hero Section ── */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "0 24px",
          textAlign: "center",
          position: "relative",
        }}
      >
        {/* Background glow effects */}
        <div style={{ position: "absolute", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0) 70%)", top: "20%", left: "50%", transform: "translateX(-50%)", filter: "blur(60px)", zIndex: 0, pointerEvents: "none" }} />
        
        <div style={{ zIndex: 1, position: "relative", maxWidth: "900px" }}>
          <div style={{ display: "inline-block", padding: "6px 12px", border: "1px solid #2C2C2C", borderRadius: "100px", fontSize: "12px", fontWeight: 600, color: "#A1A1AA", marginBottom: "24px", background: "rgba(255,255,255,0.03)" }}>
            Powered by Stellar & Soroban
          </div>
          
          <h1
            style={{
              fontSize: "clamp(3rem, 8vw, 6.5rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
              margin: "0 0 24px 0",
              background: "linear-gradient(180deg, #FFFFFF 0%, #71717A 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            The Ultimate Web3<br />Launch & Trading Hub
          </h1>
          
          <p
            style={{
              fontSize: "clamp(1.1rem, 2vw, 1.4rem)",
              color: "#A1A1AA",
              lineHeight: 1.5,
              maxWidth: "600px",
              margin: "0 auto 48px auto",
              fontWeight: 400,
            }}
          >
            Chain-abstracted infrastructure for launching tokens, trading deep liquidity, and executing intents across Stellar and beyond.
          </p>

          <Link
            href="/dashboard"
            className="hero-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#fff",
              color: "#000",
              padding: "16px 36px",
              borderRadius: "900px",
              fontSize: "16px",
              fontWeight: 700,
              textDecoration: "none",
              transition: "transform 0.2s",
            }}
          >
            Launch App
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
          </Link>
        </div>
      </section>

      {/* ── Marquee Section ── */}
      <div style={{ borderTop: "1px solid #2C2C2C", borderBottom: "1px solid #2C2C2C", padding: "24px 0", overflow: "hidden", display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>
        <div style={{ display: "inline-block", paddingLeft: "100%", animation: "marquee 20s linear infinite", fontSize: "20px", fontWeight: 700, color: "#52525B", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          STELLAR · SOROBAN · NEAR INTENTS · AXELAR · CIRCLE CCTP · SUPABASE · AI AGENTS · NEXT.JS · STELLAR · SOROBAN · NEAR INTENTS · AXELAR · CIRCLE CCTP
        </div>
      </div>

      {/* ── Live Stats Section ── */}
      <section id="stats" style={{ padding: "100px 24px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <h2 style={{ fontSize: "3rem", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "16px" }}>Network Activity</h2>
          <p style={{ color: "#A1A1AA", fontSize: "1.2rem", maxWidth: "500px", margin: "0 auto" }}>Live data synced directly from the Stellar Horizon API and Supabase state.</p>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "24px" }}>
          {[
            { label: "Live XLM/USDC Price", value: midPrice ? `$${parseFloat(midPrice).toFixed(4)}` : "—", color: "#3B82F6" },
            { label: "Active Projects", value: projectCount.toString(), color: "#F59E0B" },
            { label: "Live Campaigns", value: campaignCount.toString(), color: "#10B981" },
            { label: "Competitions", value: competitionCount.toString(), color: "#8B5CF6" },
          ].map((stat, i) => (
            <div key={i} style={{ background: "#0A0A0B", border: "1px solid #2C2C2C", borderRadius: "16px", padding: "32px", textAlign: "center", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", height: "2px", background: stat.color, opacity: 0.5 }} />
              <div style={{ fontSize: "3.5rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.04em", marginBottom: "8px" }}>{stat.value}</div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#71717A", textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Ecosystem Cards ── */}
      <section id="ecosystem" style={{ padding: "100px 24px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px" }}>
            {/* Launch Card */}
            <div style={{ background: "#111", border: "1px solid #2C2C2C", borderRadius: "24px", padding: "48px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: "-10%", top: "-20%", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 70%)" }} />
              <h3 style={{ fontSize: "2.5rem", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "16px" }}>Launch</h3>
              <p style={{ color: "#A1A1AA", fontSize: "1.1rem", lineHeight: 1.6, maxWidth: "400px" }}>Deploy Stellar assets, Soroban smart tokens, or advanced AI-agent tokens instantly. Built-in bonding curves and vesting contracts.</p>
              
              <div style={{ marginTop: "40px", display: "flex", gap: "12px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#222", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"></polygon><line x1="12" y1="22" x2="12" y2="15.5"></line><polyline points="22 8.5 12 15.5 2 8.5"></polyline><polyline points="2 15.5 12 8.5 22 15.5"></polyline><line x1="12" y1="2" x2="12" y2="8.5"></line></svg>
                </div>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#222", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"></path><path d="m17 5-5-3-5 3"></path><path d="m17 19-5 3-5-3"></path><path d="M2 12h20"></path><path d="m5 7-3 5 3 5"></path><path d="m19 7 3 5-3 5"></path></svg>
                </div>
              </div>
            </div>

            {/* Trade Card */}
            <div style={{ background: "#111", border: "1px solid #2C2C2C", borderRadius: "24px", padding: "48px" }}>
              <h3 style={{ fontSize: "2.5rem", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "16px" }}>Trade</h3>
              <p style={{ color: "#A1A1AA", fontSize: "1.1rem", lineHeight: 1.6 }}>Access deep liquidity via the Stellar DEX. Execute limit orders, AMM swaps, and cross-chain intents.</p>
              
              <div style={{ marginTop: "40px", background: "#000", border: "1px solid #222", borderRadius: "12px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "14px" }}>
                  <span style={{ color: "#71717A" }}>Pay</span>
                  <span style={{ color: "#fff" }}>1,000 USDC</span>
                </div>
                <div style={{ width: "100%", height: "1px", background: "#222", margin: "12px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                  <span style={{ color: "#71717A" }}>Receive</span>
                  <span style={{ color: "#10B981" }}>~ 8,420 XLM</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "24px" }}>
            {/* Security Card */}
            <div style={{ background: "#111", border: "1px solid #2C2C2C", borderRadius: "24px", padding: "48px" }}>
              <h3 style={{ fontSize: "2.5rem", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "16px" }}>Secure</h3>
              <p style={{ color: "#A1A1AA", fontSize: "1.1rem", lineHeight: 1.6 }}>Non-custodial by design. Private keys never leave your browser. Built on proven Stellar infrastructure.</p>
            </div>

            {/* Social Booster Card */}
            <div style={{ background: "#111", border: "1px solid #2C2C2C", borderRadius: "24px", padding: "48px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", bottom: "-20%", right: "10%", width: "200px", height: "200px", border: "4px solid #222", borderRadius: "50%", transform: "rotateX(70deg) rotateY(20deg)" }} />
              <div style={{ position: "absolute", bottom: "-10%", right: "15%", width: "150px", height: "150px", border: "4px solid #333", borderRadius: "50%", transform: "rotateX(70deg) rotateY(20deg)" }} />
              
              <h3 style={{ fontSize: "2.5rem", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "16px", position: "relative", zIndex: 1 }}>Grow</h3>
              <p style={{ color: "#A1A1AA", fontSize: "1.1rem", lineHeight: 1.6, maxWidth: "400px", position: "relative", zIndex: 1 }}>Run AI-scored social campaigns. Reward your community with automated payouts on-chain via Soroban contracts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── AI Agents Section ── */}
      <section id="agents" style={{ padding: "100px 24px", borderTop: "1px solid #2C2C2C", position: "relative" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "64px", alignItems: "center" }}>
          <div style={{ flex: "1 1 400px" }}>
            <h2 style={{ fontSize: "3rem", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "24px" }}>Programmable Interop via AI Agents</h2>
            <p style={{ color: "#A1A1AA", fontSize: "1.2rem", lineHeight: 1.6, marginBottom: "32px" }}>
              Zing is fully integrated with NEAR Intents, Axelar GMP, and Circle CCTP. 
              Build autonomous agents that execute swaps, fund campaigns, and manage cross-chain liquidity without writing complex solver logic.
            </p>
            
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
              {[
                "Submit cross-chain swap intents",
                "Automated market making strategies",
                "AI-driven campaign engagement scoring",
              ].map((item, i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "1.1rem", color: "#F4F4F5" }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#222", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          
          <div style={{ background: "#0A0A0B", border: "1px solid #2C2C2C", borderRadius: "16px", padding: "32px", fontFamily: "monospace", fontSize: "14px", color: "#A1A1AA", overflowX: "auto" }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#FF5F56" }} />
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#FFBD2E" }} />
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#27C93F" }} />
            </div>
            <code>
              <span style={{ color: "#C678DD" }}>const</span> intent = <span style={{ color: "#C678DD" }}>await</span> nearIntents.<span style={{ color: "#61AFEF" }}>submitIntent</span>({`{`}<br/>
              &nbsp;&nbsp;type: <span style={{ color: "#98C379" }}>'swap'</span>,<br/>
              &nbsp;&nbsp;sourceChain: <span style={{ color: "#98C379" }}>'ethereum'</span>,<br/>
              &nbsp;&nbsp;destinationChain: <span style={{ color: "#98C379" }}>'stellar'</span>,<br/>
              &nbsp;&nbsp;amount: <span style={{ color: "#98C379" }}>'1000'</span>,<br/>
              &nbsp;&nbsp;recipient: <span style={{ color: "#98C379" }}>'GABC...'</span><br/>
              {"});"}<br/><br/>
              <span style={{ color: "#5C6370" }}>// AI agent handles solver routing</span><br/>
              <span style={{ color: "#C678DD" }}>await</span> agent.<span style={{ color: "#61AFEF" }}>monitor</span>(intent.id);
            </code>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding: "48px 24px", borderTop: "1px solid #2C2C2C" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.04em", color: "#fff" }}>
            ZING
          </div>
          <div style={{ display: "flex", gap: "32px" }}>
            <Link href="/dashboard" style={{ color: "#A1A1AA", textDecoration: "none", fontSize: "14px" }}>App</Link>
            <Link href="#" style={{ color: "#A1A1AA", textDecoration: "none", fontSize: "14px" }}>Documentation</Link>
            <Link href="#" style={{ color: "#A1A1AA", textDecoration: "none", fontSize: "14px" }}>Twitter / X</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
