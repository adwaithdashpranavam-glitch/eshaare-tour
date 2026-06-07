import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import Globe from "react-globe.gl";
import {
  Loader2,
  Wind,
  Cloud,
  Droplets,
  Clock,
  Thermometer,
  ArrowLeft,
  MapPin,
  Compass,
  Sparkles,
  ChevronRight,
} from "lucide-react";

// ─── Inline Mock Data for Labels & Cities ────────────────────────────────────
const countryLabels = [
  { name: "United Arab Emirates", lat: 23.4241, lng: 53.8478 },
  { name: "Japan", lat: 36.2048, lng: 138.2529 },
  { name: "Switzerland", lat: 46.8182, lng: 8.2275 },
  { name: "India", lat: 20.5937, lng: 78.9629 },
  { name: "United Kingdom", lat: 55.3781, lng: -3.4360 },
  { name: "France", lat: 46.2276, lng: 2.2137 },
];

const cities = [
  { name: "Dubai", lat: 25.2048, lng: 55.2708 },
  { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
  { name: "Geneva", lat: 46.2044, lng: 6.1432 },
  { name: "New Delhi", lat: 28.6139, lng: 77.2090 },
  { name: "London", lat: 51.5074, lng: -0.1278 },
  { name: "Paris", lat: 48.8566, lng: 2.3522 },
];

// ─── Countries Data ──────────────────────────────────────────────────────────
const countries = [
  {
    id: "UAE",
    lat: 23.4241,
    lng: 53.8478,
    color: "#ff3366",
    tagline: "Where luxury meets the desert horizon",
    destinations: [
      {
        name: "Burj Khalifa",
        image:
          "https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?q=80&w=1200&auto=format&fit=crop",
        tag: "Icon",
      },
      {
        name: "Palm Jumeirah",
        image:
          "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1200&auto=format&fit=crop",
        tag: "Resort",
      },
      {
        name: "Desert Safari Dubai",
        image:
          "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?q=80&w=1200&auto=format&fit=crop",
        tag: "Experience",
      },
    ],
  },
  {
    id: "Japan",
    lat: 36.2048,
    lng: 138.2529,
    color: "#ff7b00",
    tagline: "Ancient traditions, neon-lit futures",
    destinations: [
      {
        name: "Tokyo (Shibuya)",
        image:
          "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1200&auto=format&fit=crop",
        tag: "City",
      },
      {
        name: "Kyoto Kinkaku-ji",
        image:
          "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200&auto=format&fit=crop",
        tag: "Heritage",
      },
    ],
  },
  {
    id: "Switzerland",
    lat: 46.8182,
    lng: 8.2275,
    color: "#00c2ff",
    tagline: "Alpine serenity above the clouds",
    destinations: [
      {
        name: "Interlaken & Jungfrau",
        image:
          "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop",
        tag: "Nature",
      },
    ],
  },
  {
    id: "India",
    lat: 20.5937,
    lng: 78.9629,
    color: "#00ff99",
    tagline: "A tapestry of colour, culture and calm",
    destinations: [
      {
        name: "Kerala Backwaters",
        image:
          "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=1200&auto=format&fit=crop",
        tag: "Wellness",
      },
    ],
  },
];

const POIs = [
  {
    name: "Burj Khalifa",
    lat: 25.1972,
    lng: 55.2744,
    country: "UAE",
    image:
      "https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?q=80&w=1200&auto=format&fit=crop",
    desc: "The world's tallest building, climbing 828 metres above Dubai's skyline with observation decks that redefine perspective.",
  },
  {
    name: "Palm Jumeirah",
    lat: 25.1124,
    lng: 55.139,
    country: "UAE",
    image:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1200&auto=format&fit=crop",
    desc: "The iconic palm tree-shaped archipelago containing world-class high-end resorts, private beaches and residences.",
  },
  {
    name: "Desert Safari Dubai",
    lat: 25.0234,
    lng: 55.289,
    country: "UAE",
    image:
      "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?q=80&w=1200&auto=format&fit=crop",
    desc: "Experience red dune bashing, camel riding, and traditional Arabian dinners under a canopy of stars.",
  },
  {
    name: "Tokyo (Shibuya)",
    lat: 35.658,
    lng: 139.7016,
    country: "Japan",
    image:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1200&auto=format&fit=crop",
    desc: "The electric heart of Tokyo — futuristic neon lights and the world-famous Shibuya scramble crossing.",
  },
  {
    name: "Kyoto Kinkaku-ji",
    lat: 35.0394,
    lng: 135.7292,
    country: "Japan",
    image:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200&auto=format&fit=crop",
    desc: "The breathtaking Zen Buddhist Golden Pavilion, its gilded façade perfectly mirrored in the surrounding pond.",
  },
  {
    name: "Interlaken & Jungfrau",
    lat: 46.6863,
    lng: 7.8632,
    country: "Switzerland",
    image:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop",
    desc: "A stunning Swiss resort town between Alpine lakes with breathtaking panoramas of the Jungfrau peak.",
  },
  {
    name: "Kerala Backwaters",
    lat: 9.4981,
    lng: 76.3388,
    country: "India",
    image:
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=1200&auto=format&fit=crop",
    desc: "Cruise serene palm-fringed lagoons and mirror-still canals aboard a traditional luxury houseboat.",
  },
];

// ─── Weather stat card sub-component ────────────────────────────────────────
function WeatherStat({
  icon,
  label,
  value,
  sub,
  accent,
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.04] p-3 backdrop-blur-sm transition-colors hover:bg-white/[0.07]">
      <div className="flex items-center gap-1.5">
        <span className="text-[#7A8F6B]/70">{icon}</span>
        <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/35">
          {label}
        </span>
      </div>
      <p
        className={`text-xl font-bold leading-none ${accent ? "text-[#7A8F6B]" : "text-white"}`}
      >
        {value}
      </p>
      {sub && (
        <p className="text-[10px] leading-tight text-white/40">{sub}</p>
      )}
    </div>
  );
}

// ─── Shared Weather Widget ───────────────────────────────────────────────────
function WeatherWidget({
  loading,
  weather,
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#7A8F6B]/10">
          <Cloud size={12} className="text-[#7A8F6B]" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A8F6B]">
          Live Conditions
        </span>
        {/* Live indicator */}
        <span className="ml-auto flex items-center gap-1">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          <span className="text-[9px] uppercase tracking-widest text-emerald-400/70">
            Live
          </span>
        </span>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-4">
          <Loader2 size={16} className="animate-spin text-[#7A8F6B]" />
          <span className="text-xs text-white/40">
            Fetching local conditions…
          </span>
        </div>
      ) : weather ? (
        <div className="grid grid-cols-2 gap-2">
          <WeatherStat
            icon={<Thermometer size={10} />}
            label="Temperature"
            value={`${weather.temp}°C`}
            sub={weather.condition}
          />
          <WeatherStat
            icon={<Clock size={10} />}
            label="Local Time"
            value={weather.time}
            sub="Auto timezone"
            accent
          />
          <WeatherStat
            icon={<Droplets size={10} />}
            label="Humidity"
            value={`${weather.humidity}%`}
          />
          <WeatherStat
            icon={<Wind size={10} />}
            label="Wind"
            value={`${weather.wind}`}
            sub="km / h"
          />
        </div>
      ) : (
        <p className="py-2 text-xs text-white/30">
          Weather data unavailable
        </p>
      )}
    </div>
  );
}

// ─── Destination Card ────────────────────────────────────────────────────────
function DestCard({ dest }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] transition-all duration-300 hover:border-[#7A8F6B]/25 hover:bg-white/[0.06]">
      {/* Image */}
      <div className="relative h-40 overflow-hidden rounded-t-2xl">
        <img
          src={dest.image}
          alt={dest.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        {/* Tag badge */}
        {dest.tag && (
          <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/40 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-white/80 backdrop-blur-md">
            {dest.tag}
          </span>
        )}
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="text-sm font-semibold text-white/90">{dest.name}</h3>
        <ChevronRight
          size={14}
          className="text-white/20 transition-colors group-hover:text-[#7A8F6B]"
        />
      </div>
    </div>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────
function Divider() {
  return (
    <div className="my-4 flex items-center gap-3">
      <span className="h-px flex-1 bg-white/[0.07]" />
      <span className="h-1 w-1 rounded-full bg-[#7A8F6B]/40" />
      <span className="h-px flex-1 bg-white/[0.07]" />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function GlobePage() {
  const globeRef = useRef(null);
  const animFrameRef = useRef(null);
  const navigate = useNavigate();

  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedPOI, setSelectedPOI] = useState(null);
  const [zoomTier, setZoomTier] = useState("space");
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [countriesGeo, setCountriesGeo] = useState({ features: [] });
  const [globeLoading, setGlobeLoading] = useState(true);

  // Load GeoJSON
  useEffect(() => {
    fetch("https://unpkg.com/three-globe/example/img/ne_110m_admin_0_countries.geojson")
      .then((r) => r.json())
      .then(setCountriesGeo)
      .catch((e) => console.error("Failed to load map regions data:", e));
  }, []);

  // Resize
  useEffect(() => {
    const resize = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Cleanup animation frame
  useEffect(() => {
    return () => {
      if (animFrameRef.current !== null)
        cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Globe setup
  const handleGlobeReady = () => {
    if (!globeRef.current) return;
    const globe = globeRef.current;

    setGlobeLoading(false);

    globe.pointOfView({ lat: 70, lng: 70.0, altitude: 2.2 }, 0);

    const controls = globe.controls();
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.22;
    controls.minDistance = 100;
    controls.maxDistance = 450;

    controls.addEventListener("change", () => {
      const altitude = globe.pointOfView().altitude;
      if (altitude >= 1.7) setZoomTier("space");
      else if (altitude >= 1.15) setZoomTier("regional");
      else setZoomTier("poi");
    });

    const scene = globe.scene();
    const ambientLight = new THREE.AmbientLight(0x0a192f, 0.45);
    scene.add(ambientLight);

    let sunLight = scene.children.find(
      (obj) => obj.type === "DirectionalLight"
    );

    if (!sunLight) {
      sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
      scene.add(sunLight);
    } else {
      sunLight.intensity = 2.5;
    }

    let angle = 0;
    const animateSun = () => {
      angle += 0.002;
      if (sunLight) {
        sunLight.position.x = 350 * Math.sin(angle);
        sunLight.position.z = 350 * Math.cos(angle);
      }
      animFrameRef.current = requestAnimationFrame(animateSun);
    };
    animateSun();

    const CLOUDS_IMG_URL =
      "//unpkg.com/three-globe/example/img/earth-clouds.png";
    const CLOUDS_ALT = 0.006;
    let cloudsMesh;
    new THREE.TextureLoader().load(CLOUDS_IMG_URL, (cloudsTexture) => {
      cloudsMesh = new THREE.Mesh(
        new THREE.SphereGeometry(
          globe.getGlobeRadius() * (1 + CLOUDS_ALT),
          75,
          75
        ),
        new THREE.MeshPhongMaterial({
          map: cloudsTexture,
          transparent: true,
          opacity: 0.85,
        })
      );
      globe.scene().add(cloudsMesh);
      const rotateClouds = () => {
        if (cloudsMesh) cloudsMesh.rotation.y += 0.00035;
        requestAnimationFrame(rotateClouds);
      };
      rotateClouds();
    });
  };

  // Fetch Weather
  const fetchWeather = async (lat, lng) => {
    try {
      setWeatherLoading(true);
      setWeather(null);
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`
      );
      if (!res.ok) throw new Error("Failed to fetch weather data");
      const data = await res.json();

      const temp = Math.round(data.current.temperature_2m);
      const humidity = data.current.relative_humidity_2m;
      const wind = Math.round(data.current.wind_speed_10m);
      const code = data.current.weather_code;
      const utcOffsetSeconds = data.utc_offset_seconds || 0;
      const localTime = new Date(
        Date.now() +
        utcOffsetSeconds * 1000 +
        new Date().getTimezoneOffset() * 60000
      );
      const formattedTime = localTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      let condition = "Clear";
      if (code === 0) condition = "Clear Sky";
      else if ([1, 2, 3].includes(code)) condition = "Partly Cloudy";
      else if ([45, 48].includes(code)) condition = "Foggy";
      else if ([51, 53, 55].includes(code)) condition = "Drizzle";
      else if ([61, 63, 65].includes(code)) condition = "Rainy";
      else if ([71, 73, 75].includes(code)) condition = "Snowy";
      else if ([80, 81, 82].includes(code)) condition = "Showers";
      else if ([95, 96, 99].includes(code)) condition = "Thunderstorm";

      setWeather({ temp, condition, humidity, wind, time: formattedTime });
    } catch {
      setWeather({
        temp: 26,
        condition: "Sunny",
        humidity: 50,
        wind: 10,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    } finally {
      setWeatherLoading(false);
    }
  };

  // Handlers
  const handleCountrySelect = (country) => {
    setSelectedPOI(null);
    setSelectedCountry(country);
    fetchWeather(country.lat, country.lng);
    globeRef.current.pointOfView(
      { lat: country.lat, lng: country.lng, altitude: 1.0 },
      1800
    );
  };

  const pointsData =
    zoomTier === "space"
      ? countries.map((c) => ({
        name: c.id,
        lat: c.lat,
        lng: c.lng,
        color: c.color,
        size: 0.16,
        isPOI: false,
      }))
      : [
        ...countries.map((c) => ({
          name: c.id,
          lat: c.lat,
          lng: c.lng,
          color: c.color,
          size: 0.13,
          isPOI: false,
        })),
        ...POIs.map((p) => ({
          ...p,
          color: "#7A8F6B",
          size: 0.22,
          isPOI: true,
        })),
      ];

  const handleClose = () => {
    setSelectedCountry(null);
    setSelectedPOI(null);
  };

  // Shared panel classes
  const panelBase =
    "absolute right-0 top-[50px] z-40 flex h-[calc(100%-40px)] w-full flex-col border-l border-white/[0.06] bg-black/60 text-white backdrop-blur-2xl lg:w-[420px] xl:w-[460px] rounded-tl-2xl rounded-bl-2xl overflow-hidden";

  return (
    <section
      className="relative h-screen w-full overflow-hidden bg-[#16652A]"
      aria-label="Interactive world travel map"
    >
      {/* Globe Loading Overlay */}
      <AnimatePresence>
        {globeLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-[#16652A]"
          >
            <div className="flex flex-col items-center gap-5">
              {/* Animated orbit rings */}
              <div className="relative flex h-16 w-16 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#627555] opacity-20" />
                <span className="absolute h-10 w-10 rounded-full border-2 border-[#627555]/30" />
                <span
                  className="h-16 w-16 rounded-full border-2 border-t-[#7A8F6B] border-r-transparent border-b-transparent border-l-transparent animate-spin"
                  style={{ animationDuration: "1.1s" }}
                />
                <Compass className="absolute h-5 w-5 text-[#7A8F6B]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold tracking-[0.2em] uppercase text-[#7A8F6B]">
                  Loading Earth
                </p>
                <p className="mt-1 text-xs text-white/35 tracking-widest uppercase">
                  Preparing your journey
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Space background */}
      <div
        aria-hidden
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2500&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Globe */}
      <div className="absolute inset-0 z-10">
        <Globe
          ref={globeRef}
          onGlobeReady={handleGlobeReady}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          showAtmosphere
          atmosphereColor="#1a66ff"
          atmosphereAltitude={0.25}
          polygonsData={countriesGeo.features}
          polygonCapColor={() => "rgba(255,255,255,0.01)"}
          polygonSideColor={() => "rgba(255,255,255,0.02)"}
          polygonStrokeColor={() => "rgba(255,255,255,0.12)"}
          polygonsTransitionDuration={300}
          htmlElementsData={zoomTier !== "space" ? cities : []}
          htmlLat={(d) => d.lat}
          htmlLng={(d) => d.lng}
          htmlElement={(d) => {
            const el = document.createElement("div");
            el.innerHTML = `<div style="color:white;font-size:10px;font-weight:600;text-shadow:0 0 6px black;white-space:nowrap;opacity:0.8;">${d.name}</div>`;
            return el;
          }}
          labelsData={zoomTier !== "poi" ? countryLabels : []}
          labelLat={(d) => d.lat}
          labelLng={(d) => d.lng}
          labelText={(d) => d.name}
          labelSize={1.4}
          labelDotRadius={0}
          labelColor={() => "#ffffff"}
          labelResolution={4}
          labelAltitude={0.015}
          pointsData={pointsData}
          pointColor={(d) => d.color || "#ffffff"}
          pointAltitude={0.018}
          pointRadius="size"
          onPointClick={(point) => {
            if (point.isPOI) {
              setSelectedPOI(point);
              setSelectedCountry(null);
              fetchWeather(point.lat, point.lng);
              globeRef.current.pointOfView(
                { lat: point.lat, lng: point.lng, altitude: 0.6 },
                1800
              );
            } else {
              const found = countries.find((c) => c.id === point.name);
              if (found) handleCountrySelect(found);
            }
          }}
          onGlobeClick={handleClose}
        />
      </div>

      {/* ── Panels ───────────────────────────────────────────────── */}
      <AnimatePresence>

        {/* ── Country Panel ─────────────────────────────────────── */}
        {selectedCountry && (
          <motion.aside
            key="country-panel"
            role="complementary"
            aria-label={`${selectedCountry.id} travel details`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 22, stiffness: 110 }}
            className={panelBase}
          >
            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {/* Hero strip */}
              <div className="relative border-b border-white/[0.06] px-6 pb-5 pt-6">
                {/* Back button */}
                <button
                  onClick={handleClose}
                  aria-label="Close panel and return to globe"
                  className="group mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/50 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7A8F6B]"
                >
                  <ArrowLeft size={10} className="transition group-hover:-translate-x-0.5" />
                  Back to Earth
                </button>

                {/* Country identity */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <MapPin size={12} className="text-[#7A8F6B]" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7A8F6B]/80">
                        Destination
                      </span>
                    </div>
                    <h2 className="text-4xl font-black tracking-tight text-white">
                      {selectedCountry.id}
                    </h2>
                    <p className="mt-1.5 text-sm text-white/40 font-light leading-snug">
                      {selectedCountry.tagline}
                    </p>
                  </div>
                  {/* Pulse marker */}
                  <span
                    className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#7A8F6B]/30 bg-[#7A8F6B]/10"
                    aria-hidden
                  >
                    <span className="h-2 w-2 rounded-full bg-[#7A8F6B] animate-pulse" />
                  </span>
                </div>
              </div>

              {/* Content area */}
              <div className="space-y-4 px-6 py-5">
                {/* Weather */}
                <WeatherWidget loading={weatherLoading} weather={weather} />

                <Divider />

                {/* Destinations heading */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={13} className="text-[#7A8F6B]" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
                      Top Destinations
                    </span>
                  </div>
                  <span className="rounded-full bg-[#7A8F6B]/10 px-2 py-0.5 text-[9px] font-bold text-[#7A8F6B]">
                    {selectedCountry.destinations.length} spots
                  </span>
                </div>

                {/* Destination cards */}
                <div className="space-y-3">
                  {selectedCountry.destinations.map((dest) => (
                    <DestCard key={dest.name} dest={dest} />
                  ))}
                </div>
              </div>
            </div>

            {/* ── Sticky CTA ── */}
            <div className="shrink-0 border-t border-white/[0.06] bg-black/40 px-6 py-4 backdrop-blur-xl">
              <Link
                to="/packages"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7A8F6B] via-[#7A8F6B] to-[#B4C5A8] py-4 text-sm font-bold text-black shadow-lg shadow-[#7A8F6B]/10 transition-all duration-200 hover:scale-[1.02] hover:shadow-[#7A8F6B]/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7A8F6B]"
              >
                <Sparkles size={14} />
                View All Packages
                <ChevronRight size={14} />
              </Link>
              <p className="mt-2 text-center text-[10px] text-white/25">

              </p>
            </div>
          </motion.aside>
        )}

        {/* ── POI Panel ─────────────────────────────────────────── */}
        {selectedPOI && (
          <motion.aside
            key="poi-panel"
            role="complementary"
            aria-label={`${selectedPOI.name} landmark details`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 22, stiffness: 110 }}
            className={panelBase}
          >
            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {/* Hero image */}
              <div className="relative h-44 w-full shrink-0 sm:h-52">
                <img
                  src={selectedPOI.image}
                  alt={selectedPOI.name}
                  className="h-full w-full object-cover"
                />
                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#16652A] via-black/30 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

                {/* Back button — floated over image */}
                <button
                  onClick={handleClose}
                  aria-label="Close panel and return to globe"
                  className="group absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/70 backdrop-blur-md transition hover:bg-black/70 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7A8F6B]"
                >
                  <ArrowLeft size={10} className="transition group-hover:-translate-x-0.5" />
                  Back
                </button>

                {/* Country badge */}
                <span className="absolute right-5 top-5 rounded-full border border-[#7A8F6B]/30 bg-black/50 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.15em] text-[#7A8F6B] backdrop-blur-md">
                  {selectedPOI.country} · Hotspot
                </span>

                {/* Title overlaid on image */}
                <div className="absolute bottom-5 left-5 right-5">
                  <h2 className="text-2xl font-black leading-tight text-white drop-shadow-lg sm:text-3xl">
                    {selectedPOI.name}
                  </h2>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-4 px-6 py-5">
                {/* About */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Compass size={12} className="text-[#7A8F6B]" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A8F6B]/80">
                      About This Landmark
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-white/60">
                    {selectedPOI.desc}
                  </p>
                </div>

                <Divider />

                {/* Weather */}
                <WeatherWidget loading={weatherLoading} weather={weather} />
              </div>
            </div>

            {/* ── Sticky CTA ── */}
            <div className="shrink-0 border-t border-white/[0.06] bg-black/40 px-6 py-4 backdrop-blur-xl">
              <Link
                to="/packages"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7A8F6B] via-[#7A8F6B] to-[#B4C5A8] py-4 text-sm font-bold text-black shadow-lg shadow-[#7A8F6B]/10 transition-all duration-200 hover:scale-[1.02] hover:shadow-[#7A8F6B]/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7A8F6B]"
              >
                <Sparkles size={14} />
                Explore Tour Packages
                <ChevronRight size={14} />
              </Link>

              <button
                onClick={() => {
                  setSelectedPOI(null);
                  globeRef.current.pointOfView(
                    { lat: selectedPOI.lat, lng: selectedPOI.lng, altitude: 2.2 },
                    1500
                  );
                }}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 text-xs font-semibold text-white/50 transition hover:bg-white/[0.07] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7A8F6B]"
              >
                <Compass size={11} />
                Zoom Out to Globe
              </button>

              <p className="mt-2 text-center text-[10px] text-white/25">
                Curated luxury travel · Expert curation
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Cinematic vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          boxShadow: "inset 0 0 200px rgba(0,0,0,0.92)",
        }}
      />
    </section>
  );
}
