interface ErrorWithCode extends Error {
  code: string | number;
}

type ErrorCode = number;

interface CreateErrorFn {
  (code: ErrorCode, msg: string): never;
}

const createError: CreateErrorFn = (code, msg) => {
  const error: ErrorWithCode = new Error(msg) as ErrorWithCode;

  error.code = code;
  throw error;
};

export default createError;
