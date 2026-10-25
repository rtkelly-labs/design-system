/**
 * A generated .NET server profile, shaped like a real `dotnet-trace` capture of
 * an ASP.NET Core API after `stackcollapse` — Kestrel and the middleware chain,
 * MVC, async state machines (`<PlaceAsync>d__12.MoveNext`), EF Core over Npgsql
 * down to the socket, System.Text.Json walking a DTO graph, a tiering JIT, GC
 * and an idle thread pool, with a long tail of slivers.
 *
 * Deterministic: a seeded PRNG decides the structure and the weights, so every
 * render, story and screenshot sees the same 20,000-odd samples. Nothing reads
 * `Math.random` or the clock.
 */

/** mulberry32: a tiny seeded PRNG. */
export function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;
type Emit = (path: readonly string[], samples: number) => void;
/** A routine spends `budget` samples beneath `path`. */
type Routine = (path: readonly string[], budget: number, rng: Rng, emit: Emit) => void;

/** Split `budget` across weighted parts, with ±25% seeded variation so towers are uneven. */
function split(budget: number, weights: readonly number[], rng: Rng): number[] {
  const varied = weights.map((weight) => weight * (0.75 + rng() * 0.5));
  const total = varied.reduce((sum, weight) => sum + weight, 0);
  return varied.map((weight) => (budget * weight) / total);
}

/** Call each `[frames, weight, routine]` under `path`, keeping `self` of the budget on the caller. */
function calls(path: readonly string[], budget: number, rng: Rng, emit: Emit, self: number, parts: ReadonlyArray<readonly [readonly string[], number, Routine | null]>): void {
  const shares = split(budget, [self, ...parts.map(([, weight]) => weight)], rng);
  emit(path, shares[0]);
  parts.forEach(([frames, , routine], index) => {
    const next = [...path, ...frames];
    const share = shares[index + 1];
    if (routine && share >= 2) routine(next, share, rng, emit);
    else emit(next, share);
  });
}

/** An `async` hop: the compiler's state machine. (The builder's `Start` frame is folded out, as `--simplify` would.) */
const hop = (type: string, method: string, n: number) => [`${type}.<${method}>d__${n}.MoveNext`];

/** Leaves the runtime spends small amounts of time in, anywhere: the long tail. */
const SLIVERS = [
  'System.Buffers.TlsOverPerCoreLockedStacksArrayPool`1.Rent',
  'System.Threading.ExecutionContext.RunInternal',
  'System.Runtime.CompilerServices.CastHelpers.ChkCastAny',
  'System.Collections.Generic.Dictionary`2.FindValue',
  'System.String.Concat',
  'System.Diagnostics.Activity.Start',
  'System.Threading.Monitor.Enter',
  '[Native] JIT_New',
  '[Native] memmove',
];
const sliver: Routine = (path, budget, rng, emit) => {
  const count = 1 + Math.floor(rng() * 3);
  const picks = Array.from({ length: count }, () => SLIVERS[Math.floor(rng() * SLIVERS.length)]);
  calls(path, budget, rng, emit, 4, picks.map((name) => [[name], 1, null] as const));
};

// ---- System.Text.Json walking a DTO graph: the jagged serializer towers -----

interface Dto { name: string; strings: number; numbers: number; children: Array<[Dto, boolean]> }
const money: Dto = { name: 'MoneyDto', strings: 1, numbers: 1, children: [] };
const tag: Dto = { name: 'TagDto', strings: 2, numbers: 0, children: [] };
const product: Dto = { name: 'ProductDto', strings: 3, numbers: 1, children: [[money, false]] };
const listing: Dto = { name: 'ProductListingDto', strings: 2, numbers: 1, children: [[money, false], [tag, true]] };
const line: Dto = { name: 'OrderLineDto', strings: 1, numbers: 2, children: [[product, false], [money, false]] };
const address: Dto = { name: 'AddressDto', strings: 5, numbers: 0, children: [] };
const customer: Dto = { name: 'CustomerDto', strings: 3, numbers: 1, children: [[address, false]] };
const order: Dto = { name: 'OrderDto', strings: 2, numbers: 3, children: [[line, true], [customer, false], [money, false]] };
const page: Dto = { name: 'ProductPageDto', strings: 1, numbers: 2, children: [[listing, true]] };
const summary: Dto = { name: 'OrderSummaryDto', strings: 2, numbers: 2, children: [[money, false]] };
const history: Dto = { name: 'OrderHistoryDto', strings: 1, numbers: 1, children: [[summary, true]] };
const cart: Dto = { name: 'CartDto', strings: 1, numbers: 2, children: [[line, true], [money, false]] };

const writeValue = (dto: Dto): Routine => (path, budget, rng, emit) => {
  const object = [`System.Text.Json.Serialization.JsonConverter\`1[Shop.Api.${dto.name}].TryWrite`, `System.Text.Json.Serialization.Converters.ObjectDefaultConverter\`1[Shop.Api.${dto.name}].OnTryWrite`];
  const parts: Array<readonly [readonly string[], number, Routine | null]> = [];
  if (dto.strings) parts.push([['System.Text.Json.Serialization.Metadata.JsonPropertyInfo`1[System.String].GetMemberAndWriteJson', 'System.Text.Json.Utf8JsonWriter.WriteStringEscapeValue'], dto.strings * 3, (p, b, r, e) => calls(p, b, r, e, 2, [[['System.Text.Encodings.Web.OptimizedInboxTextEncoder.GetIndexOfFirstCharToEncode'], 3, null], [['System.Text.Json.JsonWriterHelper.EscapeString'], 1, null]])]);
  if (dto.numbers) parts.push([['System.Text.Json.Serialization.Metadata.JsonPropertyInfo`1[System.Decimal].GetMemberAndWriteJson', 'System.Text.Json.Utf8JsonWriter.WriteNumberValue', 'System.Buffers.Text.Utf8Formatter.TryFormat'], dto.numbers * 2, null]);
  for (const [child, many] of dto.children) {
    const frames = many
      ? [`System.Text.Json.Serialization.Converters.ListOfTConverter\`2[Shop.Api.${child.name}].OnWriteResume`]
      : [`System.Text.Json.Serialization.Metadata.JsonPropertyInfo\`1[Shop.Api.${child.name}].GetMemberAndWriteJson`];
    parts.push([frames, (many ? 6 : 3) * (child.children.length + 1), writeValue(child)]);
  }
  parts.push([['System.Text.Json.Utf8JsonWriter.Grow', 'System.Buffers.ArrayPool`1.Rent'], 0.6, null]);
  calls([...path, ...object], budget, rng, emit, 0.5, parts);
};

const serialize = (dto: Dto): Routine => (path, budget, rng, emit) =>
  calls(
    path,
    budget,
    rng,
    emit,
    0.3,
    [
      [['Microsoft.AspNetCore.Mvc.Formatters.SystemTextJsonOutputFormatter.WriteResponseBodyAsync', ...hop('Microsoft.AspNetCore.Mvc.Formatters.SystemTextJsonOutputFormatter', 'WriteResponseBodyAsync', 11), SERIALIZER, ...hop('System.Text.Json.JsonSerializer', 'WriteStreamAsync', 117), `System.Text.Json.Serialization.JsonConverter\`1[Shop.Api.${dto.name}].WriteCore`], 10, writeValue(dto)],
      [['System.IO.Pipelines.Pipe.FlushAsync', 'Microsoft.AspNetCore.Server.Kestrel.Core.Internal.Http.Http1OutputProducer.FlushAsync', 'System.Net.Sockets.Socket.SendAsync', '[Native] send'], 1.2, null],
    ],
  );

/** The frame the candidate makes slower: everything beneath it is ×1.3. */
export const SERIALIZER = 'System.Text.Json.JsonSerializer.SerializeAsync';

// ---- EF Core → Npgsql → the socket ---------------------------------------

const npgsqlRead: Routine = (path, budget, rng, emit) =>
  calls(path, budget, rng, emit, 0.5, [
    [['Npgsql.Internal.NpgsqlConnector.ReadMessage', ...hop('Npgsql.Internal.NpgsqlConnector', 'ReadMessageLong', 239), 'Npgsql.Internal.NpgsqlReadBuffer.Ensure', ...hop('Npgsql.Internal.NpgsqlReadBuffer', 'EnsureLong', 41), 'System.Net.Sockets.Socket.ReceiveAsync', 'System.Net.Sockets.SocketAsyncContext.ReceiveFrom', '[Native] recv'], 7, null],
    [['Npgsql.NpgsqlDataReader.NextResult', 'Npgsql.Internal.NpgsqlConnector.ReadMessage'], 2, sliver],
    [['Npgsql.NpgsqlDataReader.GetFieldValue`1', 'Npgsql.Internal.Converters.StringTextConverter.Read'], 2, null],
  ]);

const efQuery = (entity: string): Routine => (path, budget, rng, emit) =>
  calls(
    [...path, `Microsoft.EntityFrameworkCore.Query.Internal.SingleQueryingEnumerable\`1+AsyncEnumerator[Shop.Data.${entity}].MoveNextAsync`, ...hop('Microsoft.EntityFrameworkCore.Query.Internal.SingleQueryingEnumerable`1+AsyncEnumerator', 'MoveNextAsync', 21)],
    budget,
    rng,
    emit,
    0.4,
    [
      [['Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync', ...hop('Microsoft.EntityFrameworkCore.Storage.RelationalCommand', 'ExecuteReaderAsync', 19), 'Npgsql.NpgsqlCommand.ExecuteReader', ...hop('Npgsql.NpgsqlCommand', 'ExecuteReader', 102)], 6, npgsqlRead],
      [[`Microsoft.EntityFrameworkCore.Query.Internal.QueryCompiler.Execute\`1`, 'System.Linq.Expressions.Compiler.LambdaCompiler.Compile'], 1.2, sliver],
      [[`Shop.Data.${entity}Materializer.Shape`, 'Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.StartTrackingFromQuery'], 2.5, sliver],
    ],
  );

const efSave: Routine = (path, budget, rng, emit) =>
  calls([...path, 'Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync', ...hop('Microsoft.EntityFrameworkCore.DbContext', 'SaveChangesAsync', 64)], budget, rng, emit, 0.3, [
    [['Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync', 'Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync', 'Npgsql.NpgsqlCommand.ExecuteReader', ...hop('Npgsql.NpgsqlCommand', 'ExecuteReader', 102)], 5, npgsqlRead],
    [['Microsoft.EntityFrameworkCore.ChangeTracking.Internal.ChangeDetector.DetectChanges'], 2, sliver],
  ]);

// ---- The application ------------------------------------------------------

const pricing: Routine = (path, budget, rng, emit) =>
  calls([...path, 'Shop.Api.PricingEngine.Quote'], budget, rng, emit, 1, [
    [['Shop.Api.PricingEngine.ApplyDiscounts', 'Shop.Rules.RuleSet.Evaluate'], 5, (p, b, r, e) => calls(p, b, r, e, 1, [[['System.Linq.Enumerable.Sum'], 2, null], [['System.Decimal.Multiply'], 2, null], [['Shop.Rules.Condition.Matches', 'System.Text.RegularExpressions.Regex.IsMatch'], 1, null]])],
    [['System.Decimal.Round'], 0.6, null],
  ]);

const placeOrder: Routine = (path, budget, rng, emit) =>
  calls([...path, 'Shop.Api.OrderService.PlaceAsync', ...hop('Shop.Api.OrderService', 'PlaceAsync', 12)], budget, rng, emit, 0.3, [
    [[], 4, efQuery('Product')],
    [[], 3, pricing],
    [[], 4, efSave],
    [['Shop.Api.InventoryClient.ReserveAsync', ...hop('Shop.Api.InventoryClient', 'ReserveAsync', 7), 'System.Net.Http.HttpClient.SendAsync', ...hop('System.Net.Http.HttpConnection', 'SendAsync', 57), 'System.Net.Security.SslStream.WriteAsync', '[Native] SSL_write'], 1.5, null],
    [['Microsoft.Extensions.Logging.Logger.Log', 'Microsoft.Extensions.Logging.Console.ConsoleLogger.Log'], 0.4, null],
  ]);

const getOrder: Routine = (path, budget, rng, emit) =>
  calls([...path, 'Shop.Api.OrderService.GetAsync', ...hop('Shop.Api.OrderService', 'GetAsync', 9)], budget, rng, emit, 0.2, [
    [[], 6, efQuery('Order')],
    [['Microsoft.Extensions.Caching.Memory.MemoryCache.TryGetValue'], 0.8, null],
  ]);

const search: Routine = (path, budget, rng, emit) =>
  calls([...path, 'Shop.Api.CatalogService.SearchAsync', ...hop('Shop.Api.CatalogService', 'SearchAsync', 4)], budget, rng, emit, 0.4, [
    [[], 5, efQuery('Product')],
    [['Shop.Api.SearchRanker.Rank', 'System.Linq.Enumerable.OrderByDescending', 'System.Linq.EnumerableSorter`2.ComputeKeys'], 2, sliver],
  ]);

const listOrders: Routine = (path, budget, rng, emit) =>
  calls([...path, 'Shop.Api.OrderService.ListAsync', ...hop('Shop.Api.OrderService', 'ListAsync', 15)], budget, rng, emit, 0.3, [
    [[], 6, efQuery('Order')],
    [['System.Linq.Enumerable.ToList', 'System.Collections.Generic.List`1.AddWithResize'], 1, sliver],
  ]);

const getProduct: Routine = (path, budget, rng, emit) =>
  calls([...path, 'Shop.Api.CatalogService.GetAsync', ...hop('Shop.Api.CatalogService', 'GetAsync', 2)], budget, rng, emit, 0.3, [
    [['Microsoft.Extensions.Caching.Memory.MemoryCache.TryGetValue'], 2, sliver],
    [[], 4, efQuery('Product')],
  ]);

const addToCart: Routine = (path, budget, rng, emit) =>
  calls([...path, 'Shop.Api.CartService.AddAsync', ...hop('Shop.Api.CartService', 'AddAsync', 8)], budget, rng, emit, 0.3, [
    [[], 3, efQuery('Cart')],
    [[], 2, pricing],
    [[], 3, efSave],
  ]);

const getCustomer: Routine = (path, budget, rng, emit) =>
  calls([...path, 'Shop.Api.CustomerService.GetAsync', ...hop('Shop.Api.CustomerService', 'GetAsync', 3)], budget, rng, emit, 0.3, [[[], 5, efQuery('Customer')]]);

/** MVC down to an action, then the action's work and its JSON response. */
const action = (controller: string, method: string, n: number, work: Routine, dto: Dto): Routine => (path, budget, rng, emit) =>
  calls(
    [...path, 'Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.InvokeActionMethodAsync', 'Microsoft.AspNetCore.Mvc.Infrastructure.ActionMethodExecutor+TaskOfIActionResultExecutor.Execute', `Shop.Api.${controller}.${method}`, ...hop(`Shop.Api.${controller}`, method, n)],
    budget,
    rng,
    emit,
    0.2,
    [
      [[], 6, work],
      [['Microsoft.AspNetCore.Mvc.Infrastructure.ObjectResultExecutor.ExecuteAsync'], 3, serialize(dto)],
    ],
  );

/** The pipeline, outermost first; the number is the async state machine's, `null` for a middleware that does not await. */
const MIDDLEWARE: ReadonlyArray<readonly [string, number | null]> = [
  ['Microsoft.AspNetCore.Diagnostics.ExceptionHandlerMiddlewareImpl.Invoke', 31],
  ['Microsoft.AspNetCore.Routing.EndpointRoutingMiddleware.Invoke', null],
  ['Microsoft.AspNetCore.Authentication.AuthenticationMiddleware.Invoke', 6],
  ['Microsoft.AspNetCore.Authorization.AuthorizationMiddleware.Invoke', null],
];

const request: Routine = (path, budget, rng, emit) => {
  let at: string[] = [...path, 'Microsoft.AspNetCore.Server.Kestrel.Core.Internal.Http.HttpProtocol.ProcessRequests', ...hop('Microsoft.AspNetCore.Server.Kestrel.Core.Internal.Http.HttpProtocol', 'ProcessRequests', 238), 'Microsoft.AspNetCore.Hosting.HostingApplication.ProcessRequestAsync'];
  // Each middleware keeps a little for itself — auth validates a token — and passes the rest on.
  let left = budget;
  for (const [name, n] of MIDDLEWARE) {
    at = [...at, name, ...(n === null ? [] : hop(name.slice(0, name.lastIndexOf('.')), 'Invoke', n))];
    if (name.includes('Authentication')) {
      const spent = left * 0.07;
      calls(at, spent, rng, emit, 0.1, [[['Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerHandler.HandleAuthenticateAsync', 'Microsoft.IdentityModel.JsonWebTokens.JsonWebTokenHandler.ValidateToken', 'System.Security.Cryptography.RSA.VerifyData', '[Native] BCryptVerifySignature'], 1, null]]);
      left -= spent;
    } else {
      const spent = left * 0.01;
      emit(at, spent);
      left -= spent;
    }
  }
  calls([...at, 'Microsoft.AspNetCore.Routing.EndpointMiddleware.Invoke'], left, rng, emit, 0.1, [
    [[], 4.5, action('OrdersController', 'Create', 12, placeOrder, order)],
    [[], 2.5, action('OrdersController', 'Get', 8, getOrder, order)],
    [[], 1.2, action('OrdersController', 'List', 10, listOrders, history)],
    [[], 3, action('CatalogController', 'Search', 5, search, page)],
    [[], 1.4, action('CatalogController', 'Get', 3, getProduct, product)],
    [[], 1.1, action('CartController', 'Add', 6, addToCart, cart)],
    [[], 0.6, action('CustomersController', 'Get', 2, getCustomer, customer)],
  ]);
};

const gc: Routine = (path, budget, rng, emit) =>
  calls([...path, '[GC] gc_heap::garbage_collect', '[GC] gc_heap::gc1'], budget, rng, emit, 0.3, [
    [['[GC] gc_heap::mark_phase', '[GC] gc_heap::mark_object_simple'], 4, (p, b, r, e) => calls(p, b, r, e, 2, [[['[GC] gc_heap::mark_object_simple1'], 3, null], [['[GC] gc_heap::mark_steal'], 1, null]])],
    [['[GC] gc_heap::plan_phase'], 2, null],
    [['[GC] gc_heap::relocate_phase', '[GC] gc_heap::relocate_survivors'], 1.5, null],
    [['[GC] gc_heap::compact_phase', '[GC] gc_heap::compact_plug', '[Native] memmove'], 1.2, null],
  ]);

const jit: Routine = (path, budget, rng, emit) =>
  calls([...path, '[Native] TieredCompilation::BackgroundWorkerStart', '[JIT] CILJit::compileMethod', '[JIT] Compiler::compCompile'], budget, rng, emit, 0.2, [
    [['[JIT] Compiler::fgMorph'], 2, null],
    [['[JIT] LinearScan::allocateRegisters'], 2.5, null],
    [['[JIT] CodeGen::genGenerateCode', '[JIT] emitter::emitEndCodeGen'], 1.5, null],
    [['[JIT] Compiler::impImport'], 1, null],
  ]);

/** Weighted stacks before sampling noise — the shape both captures share. */
export function generateServerStacks(seed = 1729, samples = 20_000): Map<string, number> {
  const rng = seeded(seed);
  const out = new Map<string, number>();
  const emit: Emit = (path, value) => {
    if (!(value > 0) || !path.length) return;
    const key = path.join(';');
    out.set(key, (out.get(key) ?? 0) + value);
  };
  const thread = ['System.Threading.PortableThreadPool+WorkerThread.WorkerThreadStart', 'System.Threading.ThreadPoolWorkQueue.Dispatch'];
  calls([], samples, rng, emit, 0, [
    [[...thread, 'System.Threading.Tasks.Task.ExecuteWithThreadLocal'], 76, (p, b, r, e) => {
      // Requests arrive on many threads' continuations: split the same work across a few entry shapes.
      calls(p, b, r, e, 0.02, [
        [[], 6, request],
        [['System.Runtime.CompilerServices.AsyncTaskMethodBuilder`1+AsyncStateMachineBox`1.ExecutionContextCallback'], 3, request],
        [['System.Net.Sockets.SocketAsyncEngine.System.Threading.IThreadPoolWorkItem.Execute', 'System.IO.Pipelines.Pipe.ExecuteWithoutExecutionContext'], 2, request],
      ]);
    }],
    [['[GC] gc_thread_function'], 9, gc],
    [['[Native] TieredCompilation::BackgroundWorker'], 5, jit],
    [[...thread.slice(0, 1), 'System.Threading.LowLevelLifoSemaphore.WaitForSignal', '[Native] pal_wait'], 6, null],
    [['System.Threading.TimerQueue.FireNextTimers', 'Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckPublisherHostedService.RunAsync'], 0.6, sliver],
  ]);
  return out;
}

export interface FoldOptions {
  /** Seed for the ±1% run-to-run noise. */
  noiseSeed: number;
  /** Multiply stacks beneath the serializer by this. Default 1. */
  serializer?: number;
  /** Add a fraud screen under `PlaceAsync` — a frame the baseline does not have. */
  fraudScreen?: boolean;
}

/** One capture of the generated profile, as folded text. */
export function foldServerProfile(stacks: Map<string, number>, options: FoldOptions): string {
  const noise = seeded(options.noiseSeed);
  const lines: string[] = [];
  let placeAsync = 0;
  let placeKey = '';
  for (const [key, value] of stacks) {
    const scale = key.includes(SERIALIZER) ? (options.serializer ?? 1) : 1;
    const count = Math.round(value * scale * (1 + (noise() - 0.5) * 0.02));
    if (count > 0) lines.push(`${key} ${count}`);
    if (key.endsWith('Shop.Api.OrderService.<PlaceAsync>d__12.MoveNext') && value > placeAsync) {
      placeAsync = value;
      placeKey = key;
    }
  }
  if (options.fraudScreen && placeKey) {
    lines.push(`${placeKey};Shop.Api.FraudScreen.Evaluate;System.Text.RegularExpressions.Regex.IsMatch;System.Text.RegularExpressions.RegexInterpreter.Scan 260`);
    lines.push(`${placeKey};Shop.Api.FraudScreen.Evaluate 40`);
  }
  return lines.join('\n');
}
