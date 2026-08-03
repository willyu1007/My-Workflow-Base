/**
 * Per-test cleanup. Without it, components from one test stay mounted in the
 * shared jsdom document and the next test's queries match the previous test's
 * DOM — which shows up as tests that pass alone and fail in sequence.
 */
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(cleanup);
