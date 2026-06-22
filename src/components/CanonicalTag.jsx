import React from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

export default function CanonicalTag() {
  const { pathname } = useLocation();
  const url = `https://www.eshaareuae.com${pathname === "/" ? "" : pathname}`;
  return (
    <Helmet>
      <link rel="canonical" href={url} />
    </Helmet>
  );
}
