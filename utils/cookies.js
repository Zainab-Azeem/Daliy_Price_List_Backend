// No TypeScript imports needed in JS

exports.setRefreshCookie = (res, token, maxAgeMs) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("refreshToken", token, {
    httpOnly: true,
    // MUST be false for http://localhost
    secure: isProduction,
    // 'lax' works for localhost cross-origin, 'strict' for production
    sameSite: isProduction ? "strict" : "lax",
    maxAge: maxAgeMs,
    path: "/",
  });
};

exports.clearRefreshCookie = (res) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    path: "/",
  });
};

