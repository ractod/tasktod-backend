import jwt from "jsonwebtoken";
import cookie from "cookie";
import cookieParser from "cookie-parser";
export const generateToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
    },
    process.env.TOKEN_SECRET || "somethingsecret"
  );
};

export const isAuth = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) return res.status(401).send({ message: "No Token" });

  // const token = authorization.slice(7, authorization.length); // Bearer XXXXXX
  const token = authorization.split(" ")[1];
  // console.log(token);
  try {
    const verified = jwt.verify(token, process.env.TOKEN_SECRET || "somethingsecret");
    req.user = verified;
    // console.log(verified);
    next();
  } catch (error) {
    res.status(401).send({ message: "Invalid Token" });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).send({ message: "Invalid Admin Token" });
  }
};

export const isAuthWithCookie = (req, res, next) => {
  const parsedCookies = parseCookies(req);

  if (!parsedCookies.userToken) {
    return res.status(400).json({ message: "please login" });
  }

  const token = cookieParser.signedCookie(
    parsedCookies.userToken,
    process.env.COOKIE_PARSER_SECRET || "COOKIE PARSER SECRET"
  );

  try {
    const verified = jwt.verify(token, process.env.TOKEN_SECRET || "somethingsecret");
    req.user = verified;

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid Token" });
  }
};

export function findByDate(data, currentDate) {
  return data.filter(({ date }) => (
    date.day == currentDate.day && date.month == currentDate.month && date.year == currentDate.year
  ))
}

export function isOverlapping(data, date, values) {
  let overlapp = false

  findByDate(data, date).map(item => {
    if(item.startTime < values.endTime && values.endTime <= item.endTime ) overlapp = true
    if(item.startTime <= values.startTime && values.startTime < item.endTime ) overlapp = true
    if(values.startTime <= item.startTime && item.startTime < values.endTime) overlapp = true
  })

  return overlapp
}

export function setCookie(user, res) {
  const cookieOptions = {
    maxAge: 1000 * 60 * 60 * 24 * 7, // would expire after 7 days
    httpOnly: true, // The cookie only accessible by the web server
    signed: true, // Indicates if the cookie should be signed
    sameSite: "Lax",
    secure: process.env.NODE_ENV === "development" ? false : true,
    domain: process.env.NODE_ENV === "development" ? "localhost" : process.env.ORIGIN,
  };
  // res.setHeader("Set-Cookie", cookie.serialize("userToken", generateToken(user), cookieOptions));
  res.cookie("userToken", generateToken(user), cookieOptions); //
}

function parseCookies(request) {
  const list = {};
  const cookieHeader = request.headers?.cookie;
  if (!cookieHeader) return list;

  cookieHeader.split(`;`).forEach(function (cookie) {
    let [name, ...rest] = cookie.split(`=`);
    name = name?.trim();
    if (!name) return;
    const value = rest.join(`=`).trim();
    if (!value) return;
    list[name] = decodeURIComponent(value);
  });

  return list;
}
