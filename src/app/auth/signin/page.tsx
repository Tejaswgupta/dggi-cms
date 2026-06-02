"use server";
import React from "react";
import Component from "./component";
import { senditToMain } from "@/auth/tokencheckServer";

const Signin = async () => {
  await senditToMain();
  return <Component />;
};

export default Signin;
