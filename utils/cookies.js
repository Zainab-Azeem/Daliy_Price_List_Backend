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
