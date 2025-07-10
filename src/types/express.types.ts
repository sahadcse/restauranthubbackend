import { Request, Response, NextFunction } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import AppError from "../utils/AppError";

export interface TypedRequest<
  T = any,
  U extends ParsedQs = ParsedQs,
  P = ParamsDictionary
> extends Request<P, any, T, U> {
  body: T;
  params: P;
  query: U;
}

export type ErrorHandlerFunction = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => void;

export type RouteHandlerFunction = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void> | void;
