import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";

// ─── FONT & GLOBAL STYLES ─────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Montserrat:wght@200;300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { background: #0B0B0B; color: #F0EAD6; font-family: 'Montserrat', sans-serif; overflow-x: hidden; }
    ::selection { background: rgba(212,175,55,0.35); color: #F0EAD6; }
    ::-webkit-scrollbar { width: 3px; }
    ::-webkit-scrollbar-track { background: #0B0B0B; }
    ::-webkit-scrollbar-thumb { background: #D4AF37; border-radius: 2px; }
    .pf { font-family: 'Playfair Display', serif; }
    .mt { font-family: 'Montserrat', sans-serif; }
    @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
    .shimmer {
      background: linear-gradient(90deg,#b8912a 0%,#D4AF37 25%,#F0EAD6 50%,#D4AF37 75%,#b8912a 100%);
      background-size: 200% auto;
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text; animation: shimmer 6s linear infinite;
    }
    @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
    .marquee-inner { animation: marquee 35s linear infinite; display:flex; white-space:nowrap; }
    .glass {
      background: rgba(255,255,255,0.04);
      backdrop-filter: blur(24px) saturate(160%);
      -webkit-backdrop-filter: blur(24px) saturate(160%);
      border: 1px solid rgba(212,175,55,0.18);
    }
    .gold-hover { transition: all 0.35s ease; }
    .gold-hover:hover {
      box-shadow: 0 0 0 1px rgba(212,175,55,0.55), 0 0 36px rgba(212,175,55,0.15);
      border-color: rgba(212,175,55,0.55) !important;
      transform: translateY(-4px);
    }
    a { text-decoration: none; }
    button { cursor: pointer; font-family: 'Montserrat', sans-serif; }
  `}</style>
);

// ─── DATA ─────────────────────────────────────────────────────────────────────
const ORDER_LINKS = {
  ahmedabad: {
    swiggy: "https://www.swiggy.com/restaurants/zen-cafe-satellite-vastrapur-ahmedabad-38229",
    zomato: "https://www.zomato.com/ahmedabad/zen-cafe-satellite/order",
    direct: null,
  },
  mumbai: {
    swiggy: "https://www.swiggy.com/restaurants/zen-cafe-kala-ghoda-fort-fort-colaba-mumbai-9748",
    zomato: "https://www.zomato.com/mumbai/zen-cafe-fort/order",
    direct: "https://zencafe.dotpe.in",
  },
  pune: {
    swiggy: "https://www.swiggy.com/restaurants/zen-cafe-koregaon-park-pune-134883",
    zomato: "https://www.zomato.com/pune/zen-cafe-koregaon-park/order",
    direct: null,
  },
};

const CITY_DATA = {
  ahmedabad: {
    name: "Ahmedabad",
    linktree: "https://linktr.ee/zencafeahmedabad",
    locations: [
      { name: "Amdavad ni Gufa", area: "Heritage Quarter", hours: "12 PM – 8 PM", tag: "Heritage" },
      { name: "Satellite", area: "Vastrapur", hours: "11 AM – 11 PM", tag: "Flagship" },
      { name: "Bodakdev", area: "Bodakdev", hours: "11 AM – 8 PM", tag: "Lounge" },
    ],
  },
  mumbai: {
    name: "Mumbai",
    linktree: "https://linktr.ee/zencafemumbai",
    locations: [
      { name: "Kala Ghoda", area: "Fort, Colaba", hours: "11 AM – 11 PM", tag: "Art District" },
      { name: "Bake House Lane", area: "Fort", hours: "11 AM – 11 PM", tag: "Heritage Walk" },
    ],
  },
  pune: {
    name: "Pune",
    linktree: "https://linktr.ee/zencafepune",
    locations: [
      { name: "Koregaon Park", area: "Galaxy Garden", hours: "11 AM – 11 PM", tag: "Garden View" },
    ],
  },
};

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────
const Ornament = ({ center = false }) => (
  <div style={{ display:"flex", alignItems:"center", gap:12, justifyContent: center ? "center" : "flex-start" }}>
    <div style={{ width:48, height:1, background:"linear-gradient(to right, transparent, #D4AF37)" }} />
    <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 0l1.2 3.8H10L6.9 6.2l1.2 3.8L5 7.8l-3.1 2.2 1.2-3.8L0 3.8h3.8z" fill="#D4AF37"/></svg>
    <div style={{ width:48, height:1, background:"linear-gradient(to left, transparent, #D4AF37)" }} />
  </div>
);

const FI = ({ children, delay=0, style={} }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once:true, margin:"-60px" });
  return (
    <motion.div ref={ref} style={style}
      initial={{ opacity:0, y:40 }}
      animate={inView ? { opacity:1, y:0 } : {}}
      transition={{ duration:0.85, delay, ease:[0.22,1,0.36,1] }}>
      {children}
    </motion.div>
  );
};

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
const Navbar = ({ page, setPage }) => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => { setOpen(false); }, [page]);

  const nav = [
    { label:"Home", page:"home" },
    { label:"Philosophy", page:"philosophy" },
    { label:"Our Space", page:"space" },
    { label:"Locations", page:"locations" },
    { label:"Order Now", page:"order", cta:true },
  ];

  const go = (p) => { setPage(p); setOpen(false); window.scrollTo({ top:0 }); };

  return (
    <>
      <motion.nav initial={{ y:-80, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ duration:1, ease:[0.22,1,0.36,1] }}
        style={{
          position:"fixed", top:0, left:0, right:0, zIndex:200,
          padding: scrolled ? "12px 40px" : "22px 40px",
          transition:"all 0.4s ease",
          background: scrolled ? "rgba(11,11,11,0.93)" : "transparent",
          backdropFilter: scrolled ? "blur(28px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(212,175,55,0.1)" : "none",
        }}>
        <div style={{ maxWidth:1300, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          {/* Logo */}
          <button onClick={() => go("home")} style={{ background:"none", border:"none", padding:0, display:"flex", flexDirection:"column", lineHeight:1, cursor:"pointer" }}>
            <span className="pf" style={{ fontSize:22, fontWeight:600, color:"#D4AF37", letterSpacing:"0.08em" }}>ZEN</span>
            <span className="mt" style={{ fontSize:8, letterSpacing:"0.4em", color:"rgba(240,234,214,0.4)", textTransform:"uppercase" }}>CAFÉ</span>
          </button>

          {/* Desktop */}
          <div style={{ display:"flex", alignItems:"center", gap:36 }}>
            {nav.map(n => n.cta ? (
              <button key={n.label} onClick={() => go(n.page)} className="mt"
                style={{ background:"#D4AF37", border:"none", color:"#0B0B0B", padding:"10px 26px", fontSize:10, letterSpacing:"0.22em", textTransform:"uppercase", fontWeight:600, transition:"all 0.3s", cursor:"pointer", display: window.innerWidth < 480 ? "none" : "block" }}
                onMouseEnter={e => { e.currentTarget.style.background="#E8C84A"; e.currentTarget.style.transform="translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background="#D4AF37"; e.currentTarget.style.transform="translateY(0)"; }}>
                {n.label}
              </button>
            ) : (
              <button key={n.label} onClick={() => go(n.page)} className="mt"
                style={{
                  background:"none", border:"none",
                  fontSize:10, letterSpacing:"0.2em", textTransform:"uppercase", fontWeight:300,
                  cursor:"pointer", transition:"color 0.3s",
                  color: page===n.page ? "#D4AF37" : "rgba(240,234,214,0.5)",
                  borderBottom: page===n.page ? "1px solid #D4AF37" : "1px solid transparent",
                  paddingBottom:2,
                  display: window.innerWidth < 768 ? "none" : "block",
                }}
                onMouseEnter={e => e.currentTarget.style.color="#D4AF37"}
                onMouseLeave={e => { if(page!==n.page) e.currentTarget.style.color="rgba(240,234,214,0.5)"; }}>
                {n.label}
              </button>
            ))}
            {/* Hamburger */}
            <button onClick={() => setOpen(!open)}
              style={{ background:"none", border:"none", padding:"8px", display:"flex", flexDirection:"column", gap:5 }}>
              {[0,1,2].map(i => (
                <motion.div key={i}
                  style={{ width: i===1 ? 20 : 28, height:1, background:"#D4AF37", transformOrigin:"center" }}
                  animate={open ? { opacity:i===1?0:1, rotate:i===0?45:i===2?-45:0, y:i===0?6:i===2?-6:0 } : { opacity:1, rotate:0, y:0 }} />
              ))}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Full-screen menu */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.35 }}
            style={{ position:"fixed", inset:0, zIndex:199, background:"radial-gradient(ellipse at center, rgba(4,41,29,0.97) 0%, rgba(11,11,11,0.99) 100%)", backdropFilter:"blur(40px)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:32 }}>
            {nav.map((n, i) => (
              <motion.button key={n.label} onClick={() => go(n.page)}
                initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07, duration:0.45 }}
                className="pf"
                style={{ background:"none", border:"none", cursor:"pointer", fontSize:"clamp(26px,5vw,38px)", color: n.cta||page===n.page ? "#D4AF37" : "rgba(240,234,214,0.75)", fontStyle:"italic", letterSpacing:"0.05em", transition:"color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.color="#D4AF37"}
                onMouseLeave={e => { if(!n.cta && page!==n.page) e.currentTarget.style.color="rgba(240,234,214,0.75)"; }}>
                {n.label}
              </motion.button>
            ))}
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.4 }}>
              <Ornament center />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ─── FOOTER ───────────────────────────────────────────────────────────────────
const Footer = ({ setPage }) => {
  const go = (p) => { setPage(p); window.scrollTo({ top:0 }); };
  return (
    <footer style={{ borderTop:"1px solid rgba(212,175,55,0.1)", padding:"44px clamp(24px,6vw,80px)", background:"rgba(4,41,29,0.07)" }}>
      <div style={{ maxWidth:1300, margin:"0 auto" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:40, marginBottom:36 }}>
          <div>
            <div className="pf" style={{ fontSize:22, fontWeight:600, color:"#D4AF37", letterSpacing:"0.1em" }}>ZEN CAFÉ</div>
            <div className="mt" style={{ fontSize:9, letterSpacing:"0.32em", color:"rgba(240,234,214,0.22)", marginTop:6, marginBottom:18, textTransform:"uppercase" }}>A Royal Experience</div>
            <p className="mt" style={{ fontSize:12, fontWeight:300, color:"rgba(240,234,214,0.35)", lineHeight:1.75 }}>
              Sip. Savour. Slow down.<br/>Mumbai · Pune · Ahmedabad
            </p>
          </div>
          <div>
            <p className="mt" style={{ fontSize:9, letterSpacing:"0.3em", color:"rgba(212,175,55,0.5)", textTransform:"uppercase", marginBottom:18 }}>Navigate</p>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[["Home","home"],["Philosophy","philosophy"],["Our Space","space"],["Locations","locations"]].map(([l,p]) => (
                <button key={l} onClick={() => go(p)} className="mt"
                  style={{ background:"none", border:"none", textAlign:"left", cursor:"pointer", fontSize:13, fontWeight:300, color:"rgba(240,234,214,0.4)", letterSpacing:"0.06em", transition:"color 0.3s", padding:0 }}
                  onMouseEnter={e => e.currentTarget.style.color="#D4AF37"}
                  onMouseLeave={e => e.currentTarget.style.color="rgba(240,234,214,0.4)"}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mt" style={{ fontSize:9, letterSpacing:"0.3em", color:"rgba(212,175,55,0.5)", textTransform:"uppercase", marginBottom:18 }}>Order Online</p>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[
                ["Mumbai — Order Direct", "https://zencafe.dotpe.in"],
                ["All Cities — Swiggy & Zomato", "#"],
                ["View All Links", "https://linktr.ee/zencafe"],
              ].map(([l, href]) => (
                href === "#" ?
                <button key={l} onClick={() => go("order")} className="mt"
                  style={{ background:"none", border:"none", textAlign:"left", cursor:"pointer", fontSize:13, fontWeight:300, color:"rgba(240,234,214,0.4)", letterSpacing:"0.06em", transition:"color 0.3s", padding:0 }}
                  onMouseEnter={e => e.currentTarget.style.color="#D4AF37"}
                  onMouseLeave={e => e.currentTarget.style.color="rgba(240,234,214,0.4)"}>
                  {l}
                </button>
                :
                <a key={l} href={href} target="_blank" rel="noopener noreferrer" className="mt"
                  style={{ fontSize:13, fontWeight:300, color:"rgba(240,234,214,0.4)", letterSpacing:"0.06em", transition:"color 0.3s" }}
                  onMouseEnter={e => e.currentTarget.style.color="#D4AF37"}
                  onMouseLeave={e => e.currentTarget.style.color="rgba(240,234,214,0.4)"}>
                  {l} ↗
                </a>
              ))}
            </div>
          </div>
          <div>
            <p className="mt" style={{ fontSize:9, letterSpacing:"0.3em", color:"rgba(212,175,55,0.5)", textTransform:"uppercase", marginBottom:18 }}>Hours</p>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[["Mumbai","11 AM – 11 PM"],["Ahmedabad","11 AM – 11 PM"],["Pune","11 AM – 11 PM"]].map(([city,hours]) => (
                <div key={city} style={{ display:"flex", justifyContent:"space-between", gap:16 }}>
                  <span className="mt" style={{ fontSize:12, fontWeight:300, color:"rgba(240,234,214,0.4)" }}>{city}</span>
                  <span className="mt" style={{ fontSize:11, fontWeight:300, color:"rgba(212,175,55,0.45)" }}>{hours}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ borderTop:"1px solid rgba(212,175,55,0.07)", paddingTop:24, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
          <p className="mt" style={{ fontSize:10, color:"rgba(240,234,214,0.18)", letterSpacing:"0.08em" }}>
            © {new Date().getFullYear()} Zen Café India · All Rights Reserved
          </p>
          <div style={{ display:"flex", gap:24 }}>
            {[["Website","https://zencafe.co"],["Linktree","https://linktr.ee/zencafe"]].map(([l,href]) => (
              <a key={l} href={href} target="_blank" rel="noopener noreferrer" className="mt"
                style={{ fontSize:9, letterSpacing:"0.22em", textTransform:"uppercase", color:"rgba(212,175,55,0.3)", transition:"color 0.3s" }}
                onMouseEnter={e => e.currentTarget.style.color="#D4AF37"}
                onMouseLeave={e => e.currentTarget.style.color="rgba(212,175,55,0.3)"}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// PAGE: HOME
// ══════════════════════════════════════════════════════════════════════════════
const HomePage = ({ setPage }) => {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target:heroRef, offset:["start start","end start"] });
  const yBg = useTransform(scrollYProgress, [0,1], [0, 130]);
  const opHero = useTransform(scrollYProgress, [0,0.75], [1, 0]);
  const go = (p) => { setPage(p); window.scrollTo({ top:0 }); };

  const marqueeItems = ["Cappuccino","Cold Press","Falafel","Dark Callebaut","Thin-Crust Pizza","Panini","Health Smoothie","Quesadilla","Organic Brown Sugar","Iced Tea","Garden Salad","Flat White"];

  return (
    <div>
      {/* HERO */}
      <section ref={heroRef} style={{ position:"relative", height:"100vh", minHeight:680, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <motion.div style={{ position:"absolute", inset:"-15%", y:yBg }}>
          <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 70% 60% at 55% 40%, rgba(4,41,29,0.55) 0%, transparent 70%)" }} />
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, rgba(11,11,11,0.15) 0%, rgba(11,11,11,0.55) 100%)" }} />
          <svg style={{ position:"absolute", right:"3%", top:"8%", width:"clamp(260px,40vw,560px)", opacity:0.07 }} viewBox="0 0 600 600">
            <circle cx="300" cy="300" r="290" fill="none" stroke="#D4AF37" strokeWidth="0.8"/>
            <circle cx="300" cy="300" r="210" fill="none" stroke="#D4AF37" strokeWidth="0.4"/>
            <circle cx="300" cy="300" r="140" fill="none" stroke="#D4AF37" strokeWidth="0.8"/>
            <circle cx="300" cy="300" r="70" fill="none" stroke="#D4AF37" strokeWidth="0.4"/>
            <circle cx="300" cy="300" r="18" fill="#D4AF37" opacity="0.5"/>
            {Array.from({length:12},(_,i)=>i*30).map(a=>(
              <line key={a} x1={300+Math.cos(a*Math.PI/180)*70} y1={300+Math.sin(a*Math.PI/180)*70} x2={300+Math.cos(a*Math.PI/180)*290} y2={300+Math.sin(a*Math.PI/180)*290} stroke="#D4AF37" strokeWidth="0.25"/>
            ))}
          </svg>
        </motion.div>
        <div style={{ position:"absolute", inset:0, backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.022'/%3E%3C/svg%3E\")", pointerEvents:"none" }} />

        <motion.div style={{ position:"relative", zIndex:2, textAlign:"center", padding:"0 clamp(20px,5vw,60px)", maxWidth:900, opacity:opHero }}>
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3, duration:0.8 }}
            style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:16, marginBottom:28 }}>
            <div style={{ width:50, height:1, background:"linear-gradient(to right,transparent,#D4AF37)" }} />
            <span className="mt" style={{ fontSize:9, letterSpacing:"0.45em", color:"#D4AF37", textTransform:"uppercase" }}>Mumbai · Pune · Ahmedabad</span>
            <div style={{ width:50, height:1, background:"linear-gradient(to left,transparent,#D4AF37)" }} />
          </motion.div>

          <motion.h1 className="pf shimmer" initial={{ opacity:0, y:32 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5, duration:1, ease:[0.22,1,0.36,1] }}
            style={{ fontSize:"clamp(52px,9vw,112px)", fontWeight:400, lineHeight:1.05, marginBottom:28, letterSpacing:"-0.01em" }}>
            Sip. Savour.<br/><em style={{ fontStyle:"italic" }}>Slow down.</em>
          </motion.h1>

          <motion.p className="mt" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.75, duration:0.9 }}
            style={{ fontSize:"clamp(13px,1.5vw,16px)", fontWeight:300, lineHeight:1.9, color:"rgba(240,234,214,0.58)", maxWidth:560, margin:"0 auto 48px", letterSpacing:"0.04em" }}>
            A soothing counterpoint to the stresses of urban living. Perched curiously beyond the city fray — a serene, bespoke environment for the creative spirit.
          </motion.p>

          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:1, duration:0.8 }}
            style={{ display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap" }}>
            <button onClick={() => go("order")} className="mt"
              style={{ padding:"15px 48px", background:"#D4AF37", border:"none", color:"#0B0B0B", fontSize:10, letterSpacing:"0.26em", textTransform:"uppercase", fontWeight:600, transition:"all 0.3s", cursor:"pointer" }}
              onMouseEnter={e => { e.currentTarget.style.background="#E8C84A"; e.currentTarget.style.transform="translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background="#D4AF37"; e.currentTarget.style.transform="translateY(0)"; }}>
              Order Now
            </button>
            <button onClick={() => go("locations")} className="mt"
              style={{ padding:"15px 48px", background:"transparent", border:"1px solid rgba(212,175,55,0.35)", color:"rgba(240,234,214,0.65)", fontSize:10, letterSpacing:"0.26em", textTransform:"uppercase", fontWeight:300, transition:"all 0.35s", cursor:"pointer" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor="#D4AF37"; e.currentTarget.style.color="#D4AF37"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(212,175,55,0.35)"; e.currentTarget.style.color="rgba(240,234,214,0.65)"; }}>
              Find a Café
            </button>
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.6 }}
          style={{ position:"absolute", bottom:36, left:"50%", transform:"translateX(-50%)", display:"flex", flexDirection:"column", alignItems:"center", gap:8, zIndex:2 }}>
          <span className="mt" style={{ fontSize:8, letterSpacing:"0.35em", color:"rgba(212,175,55,0.45)", textTransform:"uppercase" }}>Scroll</span>
          <motion.div style={{ width:1, height:36, background:"linear-gradient(to bottom,#D4AF37,transparent)" }}
            animate={{ scaleY:[1,0.3,1], opacity:[0.8,0.2,0.8] }} transition={{ duration:2.2, repeat:Infinity }} />
        </motion.div>
      </section>

      {/* MARQUEE */}
      <div style={{ borderTop:"1px solid rgba(212,175,55,0.08)", borderBottom:"1px solid rgba(212,175,55,0.08)", padding:"16px 0", overflow:"hidden", background:"rgba(4,41,29,0.1)" }}>
        <div className="marquee-inner" style={{ gap:52 }}>
          {[...marqueeItems,...marqueeItems].map((item,i) => (
            <span key={i} style={{ display:"inline-flex", alignItems:"center", gap:52 }}>
              <span className="pf" style={{ fontSize:13, color:"rgba(212,175,55,0.38)", fontStyle:"italic" }}>{item}</span>
              <span style={{ width:3, height:3, borderRadius:"50%", background:"rgba(212,175,55,0.22)", flexShrink:0, display:"inline-block" }} />
            </span>
          ))}
        </div>
      </div>

      {/* FEATURE CARDS */}
      <section style={{ padding:"clamp(72px,10vw,140px) clamp(24px,6vw,80px)" }}>
        <div style={{ maxWidth:1300, margin:"0 auto" }}>
          <FI><div style={{ textAlign:"center", marginBottom:72 }}>
            <Ornament center />
            <p className="mt" style={{ fontSize:9, letterSpacing:"0.4em", color:"#D4AF37", textTransform:"uppercase", marginTop:20, marginBottom:16 }}>What Awaits You</p>
            <h2 className="pf" style={{ fontSize:"clamp(32px,4.5vw,62px)", fontWeight:400, color:"#F0EAD6", lineHeight:1.1 }}>
              The Zen <em style={{ color:"#D4AF37" }}>Experience</em>
            </h2>
          </div></FI>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(270px,1fr))", gap:20 }}>
            {[
              { title:"The Philosophy", sub:"Craft & Provenance", desc:"Meticulously crafted beverages, global comfort fare, and ingredients sourced with obsessive care — from Belgian Callebaut to organic brown sugar.", page:"philosophy", icon:"☕" },
              { title:"The Space", sub:"Modern Co-working", desc:"A rejection of drab cubicles. A sanctuary for the 4 stages of meaningful work — Present, Discuss, Incubate, Execute.", page:"space", icon:"✦" },
              { title:"Our Locations", sub:"3 Cities · 6 Outposts", desc:"From the heritage lanes of Kala Ghoda to the leafy boulevards of Koregaon Park — find your nearest sanctuary.", page:"locations", icon:"◎" },
            ].map((c,i) => (
              <FI key={i} delay={i*0.12}>
                <button onClick={() => go(c.page)} className="glass gold-hover"
                  style={{ padding:"44px 36px", border:"1px solid rgba(212,175,55,0.14)", textAlign:"left", cursor:"pointer", width:"100%", display:"block", position:"relative", background:"rgba(255,255,255,0.03)" }}>
                  <div style={{ position:"absolute", top:14, right:14, opacity:0.3 }}>
                    <svg width="20" height="20" viewBox="0 0 20 20"><path d="M1 1h8M1 1v8" stroke="#D4AF37" strokeWidth="1"/></svg>
                  </div>
                  <div style={{ fontSize:30, marginBottom:22 }}>{c.icon}</div>
                  <p className="mt" style={{ fontSize:9, letterSpacing:"0.3em", color:"rgba(212,175,55,0.6)", textTransform:"uppercase", marginBottom:10 }}>{c.sub}</p>
                  <h3 className="pf" style={{ fontSize:26, fontWeight:500, color:"#F0EAD6", marginBottom:16, lineHeight:1.15 }}>{c.title}</h3>
                  <p className="mt" style={{ fontSize:13, fontWeight:300, color:"rgba(240,234,214,0.5)", lineHeight:1.85, marginBottom:28 }}>{c.desc}</p>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span className="mt" style={{ fontSize:9, letterSpacing:"0.25em", color:"#D4AF37", textTransform:"uppercase" }}>Explore</span>
                    <div style={{ width:28, height:1, background:"linear-gradient(to right,#D4AF37,transparent)" }} />
                  </div>
                </button>
              </FI>
            ))}
          </div>
        </div>
      </section>

      {/* QUOTE */}
      <FI>
        <div style={{ padding:"clamp(60px,9vw,110px) clamp(24px,10vw,140px)", textAlign:"center", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse, rgba(4,41,29,0.25) 0%, transparent 70%)", pointerEvents:"none" }} />
          <p className="pf" style={{ fontSize:"clamp(20px,3.5vw,42px)", fontWeight:400, color:"rgba(240,234,214,0.68)", lineHeight:1.55, fontStyle:"italic", maxWidth:760, margin:"0 auto", position:"relative" }}>
            "In a world of constant noise, we offer <span style={{ color:"#D4AF37" }}>the gift of stillness</span> — one cup, one moment at a time."
          </p>
          <div style={{ marginTop:28 }}><Ornament center /></div>
        </div>
      </FI>

      {/* ORDER STRIP */}
      <section style={{ padding:"clamp(60px,8vw,100px) clamp(24px,6vw,80px)", background:"rgba(4,41,29,0.12)", borderTop:"1px solid rgba(212,175,55,0.08)", borderBottom:"1px solid rgba(212,175,55,0.08)" }}>
        <div style={{ maxWidth:1300, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:28 }}>
          <div>
            <p className="mt" style={{ fontSize:9, letterSpacing:"0.4em", color:"#D4AF37", textTransform:"uppercase", marginBottom:12 }}>Ready to Order?</p>
            <h2 className="pf" style={{ fontSize:"clamp(26px,3.5vw,50px)", fontWeight:400, color:"#F0EAD6" }}>
              Delivered on <em style={{ color:"#D4AF37" }}>Swiggy & Zomato</em>
            </h2>
          </div>
          <button onClick={() => go("order")} className="mt"
            style={{ padding:"16px 48px", background:"#D4AF37", border:"none", color:"#0B0B0B", fontSize:10, letterSpacing:"0.22em", textTransform:"uppercase", fontWeight:600, cursor:"pointer", transition:"all 0.3s" }}
            onMouseEnter={e => { e.currentTarget.style.background="#E8C84A"; e.currentTarget.style.transform="translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background="#D4AF37"; e.currentTarget.style.transform="translateY(0)"; }}>
            Choose Your City
          </button>
        </div>
      </section>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// PAGE: PHILOSOPHY
// ══════════════════════════════════════════════════════════════════════════════
const PhilosophyPage = () => {
  const pillars = [
    { label:"Beverages", title:"The Cup", icon:"☕", desc:"Meticulously crafted cappuccinos, freshly roasted coffee varietals, iced teas, health smoothies, and cold-pressed juices. Each cup a meditation in itself.", detail:"Single-Origin · Small Batch · Precision Brewed" },
    { label:"Food", title:"The Plate", icon:"🍽", desc:"Global comfort fare prepared daily. Thin-crust pizzas, nachos, quesadillas, falafel, panini, and salads. Nourishment that travels the world without leaving your table.", detail:"Daily Preparation · Global Inspiration · Local Soul" },
    { label:"Quality", title:"The Provenance", icon:"✦", desc:"Dark Callebaut chocolate from Belgium, organic brown sugar, and carefully sourced flour. Quality is not a compromise — it is the very foundation of every creation.", detail:"Callebaut Belgium · Organic · Ethically Sourced" },
  ];

  const menu = [
    { title:"Hot Beverages", items:["Cappuccino","Flat White","Americano","Café Latte","Espresso","Cortado","Macchiato","Chai Latte"] },
    { title:"Cold & Fresh", items:["Cold Press Coffee","Iced Americano","Cold Brew","Iced Tea","Health Smoothie","Fresh Juice","Lemonade","Mocktails"] },
    { title:"Food", items:["Thin-Crust Pizza","Nachos","Quesadilla","Falafel Wrap","Panini","Garden Salad","ZenLunch Bowl","Waffles"] },
    { title:"Desserts", items:["Callebaut Brownie","Waffle Tower","Cheesecake","Cookie Jar","Tiramisu","Chocolate Mousse","Lemon Tart","Crumble"] },
  ];

  return (
    <div style={{ paddingTop:80 }}>
      <section style={{ padding:"clamp(72px,10vw,130px) clamp(24px,6vw,80px)", background:"rgba(4,41,29,0.07)", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"5%", left:"-3%", width:"36%", opacity:0.025, pointerEvents:"none" }}>
          <svg viewBox="0 0 400 400"><text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontFamily="Playfair Display" fontSize="320" fill="#D4AF37" fontStyle="italic">Z</text></svg>
        </div>
        <div style={{ maxWidth:1300, margin:"0 auto" }}>
          <FI>
            <Ornament />
            <p className="mt" style={{ fontSize:9, letterSpacing:"0.4em", color:"#D4AF37", textTransform:"uppercase", marginTop:20, marginBottom:16 }}>Our Philosophy</p>
            <h1 className="pf" style={{ fontSize:"clamp(42px,7vw,90px)", fontWeight:400, color:"#F0EAD6", lineHeight:1.05, maxWidth:700 }}>
              Sip <em style={{ color:"#D4AF37" }}>·</em> Savour
            </h1>
            <p className="mt" style={{ fontSize:"clamp(14px,1.4vw,17px)", fontWeight:300, color:"rgba(240,234,214,0.5)", maxWidth:560, marginTop:24, lineHeight:1.9 }}>
              Every element of the Zen Café experience is chosen with intention — the beans, the chocolate, the flour, the spirit.
            </p>
          </FI>
        </div>
      </section>

      <section style={{ padding:"clamp(64px,9vw,120px) clamp(24px,6vw,80px)" }}>
        <div style={{ maxWidth:1300, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:22 }}>
          {pillars.map((c,i) => (
            <FI key={i} delay={i*0.12}>
              <div className="glass gold-hover" style={{ padding:"48px 38px", border:"1px solid rgba(212,175,55,0.14)", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:14, right:14, opacity:0.28 }}>
                  <svg width="22" height="22" viewBox="0 0 22 22"><path d="M1 1h9M1 1v9" stroke="#D4AF37" strokeWidth="1"/></svg>
                </div>
                <div style={{ fontSize:34, marginBottom:24 }}>{c.icon}</div>
                <p className="mt" style={{ fontSize:9, letterSpacing:"0.3em", color:"rgba(212,175,55,0.55)", textTransform:"uppercase", marginBottom:10 }}>{c.label}</p>
                <h3 className="pf" style={{ fontSize:30, fontWeight:500, color:"#F0EAD6", marginBottom:18, lineHeight:1.15 }}>{c.title}</h3>
                <p className="mt" style={{ fontSize:13, fontWeight:300, color:"rgba(240,234,214,0.52)", lineHeight:1.88, marginBottom:28 }}>{c.desc}</p>
                <div style={{ borderTop:"1px solid rgba(212,175,55,0.12)", paddingTop:18 }}>
                  <p className="mt" style={{ fontSize:9, letterSpacing:"0.16em", color:"rgba(212,175,55,0.42)", textTransform:"uppercase" }}>{c.detail}</p>
                </div>
              </div>
            </FI>
          ))}
        </div>
      </section>

      <section style={{ padding:"clamp(64px,9vw,120px) clamp(24px,6vw,80px)", background:"rgba(4,41,29,0.08)", borderTop:"1px solid rgba(212,175,55,0.07)" }}>
        <div style={{ maxWidth:1300, margin:"0 auto" }}>
          <FI><div style={{ textAlign:"center", marginBottom:64 }}>
            <Ornament center />
            <h2 className="pf" style={{ fontSize:"clamp(28px,4vw,56px)", fontWeight:400, color:"#F0EAD6", marginTop:20 }}>
              A Taste of the <em style={{ color:"#D4AF37" }}>Menu</em>
            </h2>
          </div></FI>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:36 }}>
            {menu.map((s,i) => (
              <FI key={i} delay={i*0.1}>
                <div>
                  <h4 className="pf" style={{ fontSize:20, fontWeight:500, color:"#D4AF37", marginBottom:20, fontStyle:"italic" }}>{s.title}</h4>
                  <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
                    {s.items.map((item,j) => (
                      <div key={j} style={{ display:"flex", alignItems:"center", gap:12 }}>
                        <div style={{ width:4, height:4, borderRadius:"50%", background:"rgba(212,175,55,0.3)", flexShrink:0 }} />
                        <span className="mt" style={{ fontSize:13, fontWeight:300, color:"rgba(240,234,214,0.52)", letterSpacing:"0.04em" }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </FI>
            ))}
          </div>
          <FI delay={0.3}><p className="mt" style={{ textAlign:"center", marginTop:52, fontSize:11, fontWeight:300, color:"rgba(240,234,214,0.25)", letterSpacing:"0.1em", fontStyle:"italic" }}>Full menu available at all locations · Items may vary by city</p></FI>
        </div>
      </section>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// PAGE: SPACE
// ══════════════════════════════════════════════════════════════════════════════
const SpacePage = () => {
  const pillars = [
    { num:"01", title:"Present", action:"Over a ZenLunch", desc:"Face-to-face, table-side. Real presence in a distraction-free setting that honours the value of your time together." },
    { num:"02", title:"Discuss", action:"High-Level Strategy", desc:"From whiteboards to whispered ideas — a space where your best thinking finds its voice in perfect ambient calm." },
    { num:"03", title:"Incubate", action:"Quiet Ideation", desc:"Step away from the noise. Let your thoughts breathe, expand, and crystallise into something truly remarkable." },
    { num:"04", title:"Execute", action:"Fast WiFi & Flow", desc:"Seamless connectivity meets uninterrupted focus. A co-working environment that keeps pace with every ambition." },
  ];
  const amenities = [
    { icon:"⚡", label:"High-Speed WiFi", desc:"Business-grade connectivity" },
    { icon:"🔌", label:"Power Outlets", desc:"At every workspace" },
    { icon:"🎵", label:"Curated Sound", desc:"Ambient, never intrusive" },
    { icon:"☕", label:"Table Service", desc:"Your order, your pace" },
    { icon:"🌿", label:"Green Ambience", desc:"Biophilic living spaces" },
    { icon:"📱", label:"No Distractions", desc:"A true urban sanctuary" },
  ];

  return (
    <div style={{ paddingTop:80 }}>
      <section style={{ padding:"clamp(72px,10vw,130px) clamp(24px,6vw,80px)", background:"rgba(4,41,29,0.07)", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(212,175,55,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(212,175,55,0.025) 1px,transparent 1px)", backgroundSize:"80px 80px", pointerEvents:"none" }} />
        <div style={{ maxWidth:1300, margin:"0 auto" }}>
          <FI>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:60, alignItems:"end" }}>
              <div>
                <Ornament />
                <p className="mt" style={{ fontSize:9, letterSpacing:"0.4em", color:"#D4AF37", textTransform:"uppercase", marginTop:20, marginBottom:16 }}>The Space</p>
                <h1 className="pf" style={{ fontSize:"clamp(40px,6.5vw,88px)", fontWeight:400, color:"#F0EAD6", lineHeight:1.05 }}>
                  Modern<br/><em style={{ color:"#D4AF37" }}>Co-working</em>
                </h1>
              </div>
              <div style={{ paddingBottom:6 }}>
                <p className="mt" style={{ fontSize:"clamp(14px,1.4vw,16px)", fontWeight:300, color:"rgba(240,234,214,0.5)", lineHeight:1.92, marginBottom:18 }}>
                  A rejection of drab, clinical cubicles. A sanctuary designed to honour the 4 natural stages of meaningful work.
                </p>
                <p className="mt" style={{ fontSize:"clamp(14px,1.4vw,16px)", fontWeight:300, color:"rgba(240,234,214,0.5)", lineHeight:1.92 }}>
                  Every table, every corner, every cup is curated to serve your next great idea.
                </p>
              </div>
            </div>
          </FI>
        </div>
      </section>

      <section style={{ padding:"clamp(64px,9vw,120px) clamp(24px,6vw,80px)" }}>
        <div style={{ maxWidth:1300, margin:"0 auto" }}>
          <FI><div style={{ textAlign:"center", marginBottom:60 }}>
            <h2 className="pf" style={{ fontSize:"clamp(28px,3.5vw,52px)", fontWeight:400, color:"#F0EAD6" }}>
              The 4 <em style={{ color:"#D4AF37" }}>Pillars</em>
            </h2>
          </div></FI>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:2 }}>
            {pillars.map((p,i) => (
              <FI key={i} delay={i*0.1}>
                <div style={{ padding:"44px 32px", background:"rgba(255,255,255,0.025)", borderLeft:"1px solid rgba(212,175,55,0.1)", borderBottom:"1px solid rgba(212,175,55,0.06)", position:"relative", overflow:"hidden", transition:"all 0.4s ease" }}
                  onMouseEnter={e => { e.currentTarget.style.background="rgba(212,175,55,0.04)"; e.currentTarget.style.borderLeftColor="rgba(212,175,55,0.55)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.025)"; e.currentTarget.style.borderLeftColor="rgba(212,175,55,0.1)"; }}>
                  <span className="pf" style={{ fontSize:80, fontWeight:700, color:"rgba(212,175,55,0.05)", position:"absolute", top:-16, right:16, lineHeight:1 }}>{p.num}</span>
                  <p className="mt" style={{ fontSize:9, letterSpacing:"0.32em", color:"rgba(212,175,55,0.5)", textTransform:"uppercase", marginBottom:14 }}>Stage {p.num}</p>
                  <h3 className="pf" style={{ fontSize:32, fontWeight:500, color:"#F0EAD6", marginBottom:8, lineHeight:1 }}>{p.title}</h3>
                  <p className="mt" style={{ fontSize:11, letterSpacing:"0.14em", color:"#D4AF37", marginBottom:20, fontWeight:300 }}>{p.action}</p>
                  <p className="mt" style={{ fontSize:13, fontWeight:300, color:"rgba(240,234,214,0.45)", lineHeight:1.85 }}>{p.desc}</p>
                </div>
              </FI>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding:"clamp(64px,9vw,120px) clamp(24px,6vw,80px)", background:"rgba(4,41,29,0.08)", borderTop:"1px solid rgba(212,175,55,0.07)" }}>
        <div style={{ maxWidth:1300, margin:"0 auto" }}>
          <FI><div style={{ textAlign:"center", marginBottom:60 }}>
            <Ornament center />
            <h2 className="pf" style={{ fontSize:"clamp(28px,3.5vw,52px)", fontWeight:400, color:"#F0EAD6", marginTop:20 }}>
              Space <em style={{ color:"#D4AF37" }}>Amenities</em>
            </h2>
          </div></FI>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))", gap:18 }}>
            {amenities.map((a,i) => (
              <FI key={i} delay={i*0.08}>
                <div className="glass gold-hover" style={{ padding:"32px 28px", border:"1px solid rgba(212,175,55,0.12)", textAlign:"center" }}>
                  <div style={{ fontSize:26, marginBottom:16 }}>{a.icon}</div>
                  <h4 className="pf" style={{ fontSize:17, fontWeight:500, color:"#F0EAD6", marginBottom:8 }}>{a.label}</h4>
                  <p className="mt" style={{ fontSize:11, fontWeight:300, color:"rgba(240,234,214,0.38)", letterSpacing:"0.06em" }}>{a.desc}</p>
                </div>
              </FI>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// PAGE: LOCATIONS
// ══════════════════════════════════════════════════════════════════════════════
const LocationsPage = ({ setPage }) => {
  const [activeCity, setActiveCity] = useState("ahmedabad");
  const city = CITY_DATA[activeCity];
  const go = (p) => { setPage(p); window.scrollTo({ top:0 }); };

  return (
    <div style={{ paddingTop:80 }}>
      <section style={{ padding:"clamp(72px,10vw,130px) clamp(24px,6vw,80px)", background:"rgba(4,41,29,0.07)", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", bottom:0, right:0, width:"30%", opacity:0.022, pointerEvents:"none" }}>
          <svg viewBox="0 0 280 300"><text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontFamily="Playfair Display" fontSize="220" fill="#D4AF37">IN</text></svg>
        </div>
        <div style={{ maxWidth:1300, margin:"0 auto" }}>
          <FI>
            <Ornament />
            <p className="mt" style={{ fontSize:9, letterSpacing:"0.4em", color:"#D4AF37", textTransform:"uppercase", marginTop:20, marginBottom:16 }}>Find Your Sanctuary</p>
            <h1 className="pf" style={{ fontSize:"clamp(40px,6.5vw,88px)", fontWeight:400, color:"#F0EAD6", lineHeight:1.05 }}>
              The Royal <em style={{ color:"#D4AF37" }}>Map</em>
            </h1>
            <p className="mt" style={{ fontSize:"clamp(13px,1.3vw,16px)", fontWeight:300, color:"rgba(240,234,214,0.5)", maxWidth:500, marginTop:20, lineHeight:1.9 }}>
              Three cities. Six outposts. One philosophy. Wherever you are — we are near.
            </p>
          </FI>
        </div>
      </section>

      <section style={{ padding:"clamp(64px,9vw,120px) clamp(24px,6vw,80px)" }}>
        <div style={{ maxWidth:1300, margin:"0 auto" }}>
          <FI>
            <div style={{ display:"flex", borderBottom:"1px solid rgba(212,175,55,0.1)", marginBottom:56, overflowX:"auto" }}>
              {Object.entries(CITY_DATA).map(([key, c]) => (
                <button key={key} onClick={() => setActiveCity(key)} className="mt"
                  style={{ background:"none", border:"none", padding:"14px 36px", cursor:"pointer", fontSize:11, letterSpacing:"0.22em", textTransform:"uppercase", fontWeight:activeCity===key?400:300, color:activeCity===key?"#D4AF37":"rgba(240,234,214,0.35)", borderBottom:activeCity===key?"2px solid #D4AF37":"2px solid transparent", marginBottom:-1, transition:"all 0.3s", whiteSpace:"nowrap" }}>
                  {c.name}
                </button>
              ))}
            </div>
          </FI>

          <AnimatePresence mode="wait">
            <motion.div key={activeCity} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-14 }} transition={{ duration:0.4 }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))", gap:20, marginBottom:40 }}>
                {city.locations.map((loc,i) => (
                  <motion.div key={i} initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }} transition={{ delay:i*0.09 }}
                    className="glass gold-hover" style={{ padding:"40px 32px", border:"1px solid rgba(212,175,55,0.13)", position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", top:18, right:18 }}>
                      <span className="mt" style={{ fontSize:8, letterSpacing:"0.22em", color:"rgba(212,175,55,0.55)", border:"1px solid rgba(212,175,55,0.18)", padding:"4px 10px", textTransform:"uppercase" }}>{loc.tag}</span>
                    </div>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginBottom:18 }}>
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#D4AF37" opacity="0.6"/>
                    </svg>
                    <p className="mt" style={{ fontSize:9, letterSpacing:"0.28em", color:"rgba(212,175,55,0.45)", textTransform:"uppercase", marginBottom:8 }}>{city.name}</p>
                    <h3 className="pf" style={{ fontSize:22, fontWeight:500, color:"#F0EAD6", marginBottom:6, lineHeight:1.2 }}>{loc.name}</h3>
                    <p className="mt" style={{ fontSize:12, fontWeight:300, color:"rgba(240,234,214,0.32)", marginBottom:20, letterSpacing:"0.04em" }}>{loc.area}</p>
                    <div style={{ borderTop:"1px solid rgba(212,175,55,0.1)", paddingTop:18, display:"flex", alignItems:"center", gap:10 }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <circle cx="6" cy="6" r="5" stroke="#D4AF37" strokeWidth="0.9" opacity="0.5"/>
                        <path d="M6 3v3l1.6 1.2" stroke="#D4AF37" strokeWidth="1" strokeLinecap="round" opacity="0.65"/>
                      </svg>
                      <span className="mt" style={{ fontSize:12, fontWeight:300, color:"rgba(212,175,55,0.52)", letterSpacing:"0.05em" }}>{loc.hours}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Order from city */}
              <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}
                style={{ padding:"36px 40px", background:"rgba(4,41,29,0.18)", border:"1px solid rgba(212,175,55,0.11)", display:"flex", flexWrap:"wrap", justifyContent:"space-between", alignItems:"center", gap:20 }}>
                <div>
                  <p className="mt" style={{ fontSize:9, letterSpacing:"0.32em", color:"rgba(212,175,55,0.5)", textTransform:"uppercase", marginBottom:8 }}>Order from {city.name}</p>
                  <h4 className="pf" style={{ fontSize:22, fontWeight:400, color:"#F0EAD6" }}>Get it delivered</h4>
                </div>
                <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                  {ORDER_LINKS[activeCity].direct && (
                    <a href={ORDER_LINKS[activeCity].direct} target="_blank" rel="noopener noreferrer" className="mt"
                      style={{ padding:"12px 26px", background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.35)", color:"#D4AF37", fontSize:10, letterSpacing:"0.2em", textTransform:"uppercase", fontWeight:400, transition:"all 0.3s", display:"inline-block" }}
                      onMouseEnter={e => { e.currentTarget.style.background="rgba(212,175,55,0.18)"; e.currentTarget.style.transform="translateY(-2px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background="rgba(212,175,55,0.1)"; e.currentTarget.style.transform="translateY(0)"; }}>
                      Order Direct
                    </a>
                  )}
                  <a href={ORDER_LINKS[activeCity].swiggy} target="_blank" rel="noopener noreferrer" className="mt"
                    style={{ padding:"12px 26px", background:"rgba(255,87,34,0.08)", border:"1px solid rgba(255,87,34,0.28)", color:"#FF5722", fontSize:10, letterSpacing:"0.2em", textTransform:"uppercase", fontWeight:400, transition:"all 0.3s", display:"inline-block" }}
                    onMouseEnter={e => { e.currentTarget.style.background="rgba(255,87,34,0.16)"; e.currentTarget.style.transform="translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background="rgba(255,87,34,0.08)"; e.currentTarget.style.transform="translateY(0)"; }}>
                    🧡 Swiggy
                  </a>
                  <a href={ORDER_LINKS[activeCity].zomato} target="_blank" rel="noopener noreferrer" className="mt"
                    style={{ padding:"12px 26px", background:"rgba(203,52,45,0.08)", border:"1px solid rgba(203,52,45,0.28)", color:"#E23744", fontSize:10, letterSpacing:"0.2em", textTransform:"uppercase", fontWeight:400, transition:"all 0.3s", display:"inline-block" }}
                    onMouseEnter={e => { e.currentTarget.style.background="rgba(203,52,45,0.16)"; e.currentTarget.style.transform="translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background="rgba(203,52,45,0.08)"; e.currentTarget.style.transform="translateY(0)"; }}>
                    ❤️ Zomato
                  </a>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          <FI delay={0.3}>
            <div style={{ textAlign:"center", marginTop:60 }}>
              <button onClick={() => go("order")} className="mt"
                style={{ padding:"15px 52px", background:"#D4AF37", border:"none", color:"#0B0B0B", fontSize:10, letterSpacing:"0.22em", textTransform:"uppercase", fontWeight:600, cursor:"pointer", transition:"all 0.3s" }}
                onMouseEnter={e => { e.currentTarget.style.background="#E8C84A"; e.currentTarget.style.transform="translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background="#D4AF37"; e.currentTarget.style.transform="translateY(0)"; }}>
                View All Order Options
              </button>
            </div>
          </FI>
        </div>
      </section>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// PAGE: ORDER NOW
// ══════════════════════════════════════════════════════════════════════════════
const OrderPage = () => {
  const cities = [
    {
      key:"mumbai", name:"Mumbai", area:"Kala Ghoda · Bake House Lane", hours:"11 AM – 11 PM",
      links:[
        { label:"Order Direct 🤍", sub:"Earn PatronRewards Points", url:"https://zencafe.dotpe.in", color:"#D4AF37", bg:"rgba(212,175,55,0.07)", border:"rgba(212,175,55,0.38)", isPrimary:true },
        { label:"Swiggy", sub:"Kala Ghoda, Fort", url:"https://www.swiggy.com/restaurants/zen-cafe-kala-ghoda-fort-fort-colaba-mumbai-9748", color:"#FF5722", bg:"rgba(255,87,34,0.07)", border:"rgba(255,87,34,0.3)" },
        { label:"Zomato", sub:"Kala Ghoda, Fort", url:"https://www.zomato.com/mumbai/zen-cafe-fort/order", color:"#E23744", bg:"rgba(226,55,68,0.07)", border:"rgba(226,55,68,0.3)" },
        { label:"All Mumbai Links ↗", sub:"linktr.ee/zencafemumbai", url:"https://linktr.ee/zencafemumbai", color:"rgba(240,234,214,0.35)", bg:"transparent", border:"rgba(240,234,214,0.1)" },
      ]
    },
    {
      key:"ahmedabad", name:"Ahmedabad", area:"Satellite · Bodakdev · Amdavad ni Gufa", hours:"11 AM – 11 PM",
      links:[
        { label:"Swiggy", sub:"Satellite, Vastrapur", url:"https://www.swiggy.com/restaurants/zen-cafe-satellite-vastrapur-ahmedabad-38229", color:"#FF5722", bg:"rgba(255,87,34,0.07)", border:"rgba(255,87,34,0.3)" },
        { label:"Zomato", sub:"Satellite Branch", url:"https://www.zomato.com/ahmedabad/zen-cafe-satellite/order", color:"#E23744", bg:"rgba(226,55,68,0.07)", border:"rgba(226,55,68,0.3)" },
        { label:"All Ahmedabad Links ↗", sub:"linktr.ee/zencafeahmedabad", url:"https://linktr.ee/zencafeahmedabad", color:"rgba(240,234,214,0.35)", bg:"transparent", border:"rgba(240,234,214,0.1)" },
      ]
    },
    {
      key:"pune", name:"Pune", area:"Koregaon Park · Galaxy Garden", hours:"11 AM – 11 PM",
      links:[
        { label:"Swiggy", sub:"Koregaon Park", url:"https://www.swiggy.com/restaurants/zen-cafe-koregaon-park-pune-134883", color:"#FF5722", bg:"rgba(255,87,34,0.07)", border:"rgba(255,87,34,0.3)" },
        { label:"Zomato", sub:"Koregaon Park", url:"https://www.zomato.com/pune/zen-cafe-koregaon-park/order", color:"#E23744", bg:"rgba(226,55,68,0.07)", border:"rgba(226,55,68,0.3)" },
        { label:"All Pune Links ↗", sub:"linktr.ee/zencafepune", url:"https://linktr.ee/zencafepune", color:"rgba(240,234,214,0.35)", bg:"transparent", border:"rgba(240,234,214,0.1)" },
      ]
    },
  ];

  return (
    <div style={{ paddingTop:80 }}>
      <section style={{ padding:"clamp(72px,10vw,130px) clamp(24px,6vw,80px)", background:"rgba(4,41,29,0.07)", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", right:"6%", top:"50%", transform:"translateY(-50%)", opacity:0.04, pointerEvents:"none" }}>
          {[360,270,180,90].map(s=>(
            <div key={s} style={{ position:"absolute", width:s, height:s, border:"1px solid #D4AF37", borderRadius:"50%", top:"50%", left:"50%", transform:"translate(-50%,-50%)" }} />
          ))}
        </div>
        <div style={{ maxWidth:1300, margin:"0 auto" }}>
          <FI>
            <Ornament />
            <p className="mt" style={{ fontSize:9, letterSpacing:"0.4em", color:"#D4AF37", textTransform:"uppercase", marginTop:20, marginBottom:16 }}>Order Now</p>
            <h1 className="pf" style={{ fontSize:"clamp(40px,6.5vw,88px)", fontWeight:400, color:"#F0EAD6", lineHeight:1.05 }}>
              Your Table <em style={{ color:"#D4AF37" }}>Awaits</em>
            </h1>
            <p className="mt" style={{ fontSize:"clamp(13px,1.3vw,16px)", fontWeight:300, color:"rgba(240,234,214,0.5)", maxWidth:520, marginTop:20, lineHeight:1.9 }}>
              Order directly, or via Swiggy & Zomato — delivered with the same care and craft as our dine-in experience.
            </p>
          </FI>
        </div>
      </section>

      <section style={{ padding:"clamp(64px,9vw,120px) clamp(24px,6vw,80px)" }}>
        <div style={{ maxWidth:1300, margin:"0 auto", display:"flex", flexDirection:"column", gap:24 }}>
          {cities.map((city, ci) => (
            <FI key={city.key} delay={ci*0.12}>
              <div className="glass" style={{ border:"1px solid rgba(212,175,55,0.13)", overflow:"hidden", transition:"border-color 0.4s, box-shadow 0.4s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(212,175,55,0.4)"; e.currentTarget.style.boxShadow="0 0 48px rgba(212,175,55,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(212,175,55,0.13)"; e.currentTarget.style.boxShadow="none"; }}>
                <div style={{ padding:"28px 40px", borderBottom:"1px solid rgba(212,175,55,0.08)", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:14 }}>
                  <div>
                    <p className="mt" style={{ fontSize:9, letterSpacing:"0.3em", color:"rgba(212,175,55,0.45)", textTransform:"uppercase", marginBottom:6 }}>{city.area}</p>
                    <h2 className="pf" style={{ fontSize:"clamp(26px,3.2vw,42px)", fontWeight:500, color:"#F0EAD6", lineHeight:1.1 }}>{city.name}</h2>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <circle cx="6" cy="6" r="5" stroke="#D4AF37" strokeWidth="0.9" opacity="0.5"/>
                      <path d="M6 3v3l1.6 1.2" stroke="#D4AF37" strokeWidth="1" strokeLinecap="round" opacity="0.65"/>
                    </svg>
                    <span className="mt" style={{ fontSize:12, fontWeight:300, color:"rgba(212,175,55,0.5)" }}>{city.hours}</span>
                  </div>
                </div>
                <div style={{ padding:"24px 40px", display:"flex", flexWrap:"wrap", gap:14, alignItems:"center" }}>
                  {city.links.map((link,li) => (
                    <a key={li} href={link.url} target="_blank" rel="noopener noreferrer"
                      style={{
                        padding: link.isPrimary ? "14px 32px" : "12px 24px",
                        background: link.bg, border:`1px solid ${link.border}`,
                        color: link.color, display:"inline-flex", flexDirection:"column", gap:3,
                        textDecoration:"none", transition:"all 0.3s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.filter="brightness(1.15)"; }}
                      onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.filter="brightness(1)"; }}>
                      <span className="mt" style={{ fontSize:11, letterSpacing:"0.2em", textTransform:"uppercase", fontWeight:link.isPrimary?600:400 }}>{link.label}</span>
                      <span className="mt" style={{ fontSize:9, letterSpacing:"0.1em", opacity:0.55, textTransform:"uppercase" }}>{link.sub}</span>
                    </a>
                  ))}
                </div>
              </div>
            </FI>
          ))}

          <FI delay={0.35}>
            <div style={{ textAlign:"center", paddingTop:16 }}>
              <a href="https://linktr.ee/zencafe" target="_blank" rel="noopener noreferrer" className="mt"
                style={{ fontSize:11, letterSpacing:"0.22em", color:"rgba(212,175,55,0.4)", textTransform:"uppercase", transition:"color 0.3s", borderBottom:"1px solid rgba(212,175,55,0.18)", paddingBottom:3 }}
                onMouseEnter={e => e.currentTarget.style.color="#D4AF37"}
                onMouseLeave={e => e.currentTarget.style.color="rgba(212,175,55,0.4)"}>
                All Order Links at linktr.ee/zencafe ↗
              </a>
            </div>
          </FI>
        </div>
      </section>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════════════════════════
export default function ZenCafeRoyal() {
  const [page, setPage] = useState("home");
  useEffect(() => { window.scrollTo({ top:0, behavior:"smooth" }); }, [page]);

  const pages = { home: <HomePage setPage={setPage}/>, philosophy: <PhilosophyPage/>, space: <SpacePage/>, locations: <LocationsPage setPage={setPage}/>, order: <OrderPage/> };

  return (
    <div style={{ background:"#0B0B0B", minHeight:"100vh" }}>
      <GlobalStyles />
      <Navbar page={page} setPage={setPage} />
      <AnimatePresence mode="wait">
        <motion.main key={page}
          initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-12 }}
          transition={{ duration:0.42, ease:[0.22,1,0.36,1] }}>
          {pages[page]}
        </motion.main>
      </AnimatePresence>
      <Footer setPage={setPage} />
    </div>
  );
}
