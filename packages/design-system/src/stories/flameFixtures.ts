import type { FlameTree } from '../lib/flame';

/**
 * A CPU profile of an ASP.NET Core `POST /orders` handler, as folded stacks —
 * what `dotnet-trace` output looks like after a `stackcollapse` pass. Sample
 * counts carry a little seeded jitter so two captures differ the way two real
 * runs do; nothing here reads `Math.random` or the clock.
 */

/** mulberry32: a tiny seeded PRNG, so the jitter is the same on every render. */
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const KESTREL = 'Microsoft.AspNetCore.Server.Kestrel.Core.Internal.Http.HttpProtocol.ProcessRequests';
const HOSTING = 'Microsoft.AspNetCore.Hosting.HostingApplication.ProcessRequestAsync';
const ENDPOINT = 'Microsoft.AspNetCore.Routing.EndpointMiddleware.Invoke';
const CONTROLLER = 'Shop.Api.OrdersController.Create';
const PLACE = 'Shop.Api.OrderService.PlaceAsync';
const SERIALIZE = 'System.Text.Json.JsonSerializer.SerializeAsync';

const handler = [KESTREL, HOSTING, ENDPOINT, CONTROLLER];

/** Each stack, root first, and its sample weight. */
const STACKS: Array<[string[], number]> = [
  [[...handler, PLACE, 'Npgsql.NpgsqlCommand.ExecuteReaderAsync', 'Npgsql.Internal.NpgsqlConnector.ReadMessage'], 420],
  [[...handler, PLACE, 'Npgsql.NpgsqlCommand.ExecuteReaderAsync', 'Npgsql.Internal.NpgsqlConnector.Flush'], 60],
  [[...handler, PLACE, 'Shop.Api.PricingEngine.Quote', 'Shop.Api.PricingEngine.ApplyDiscounts'], 260],
  [[...handler, PLACE, 'Shop.Api.PricingEngine.Quote', 'System.Decimal.Multiply'], 40],
  [[...handler, PLACE, 'Shop.Api.PricingEngine.Quote'], 30],
  [[...handler, PLACE, 'Microsoft.Extensions.Caching.Memory.MemoryCache.TryGetValue'], 35],
  [[...handler, 'Microsoft.AspNetCore.Mvc.Formatters.SystemTextJsonInputFormatter.ReadRequestBodyAsync', 'System.Text.Json.JsonSerializer.DeserializeAsync', 'System.Text.Json.Utf8JsonReader.Read'], 180],
  [[...handler, 'Microsoft.AspNetCore.Mvc.Infrastructure.ObjectResultExecutor.ExecuteAsync', SERIALIZE, 'System.Text.Json.Utf8JsonWriter.WriteStringValue'], 210],
  [[...handler, 'Microsoft.AspNetCore.Mvc.Infrastructure.ObjectResultExecutor.ExecuteAsync', SERIALIZE, 'System.Text.Json.Serialization.Converters.ObjectDefaultConverter.OnTryWrite'], 140],
  [[...handler, 'Microsoft.Extensions.Logging.Logger.Log', 'Serilog.Sinks.SystemConsole.ConsoleSink.Emit'], 70],
  [[KESTREL, HOSTING, ENDPOINT, 'Microsoft.AspNetCore.Authentication.AuthenticationMiddleware.Invoke', 'Microsoft.IdentityModel.JsonWebTokens.JsonWebTokenHandler.ValidateToken', 'System.Security.Cryptography.RSA.VerifyData'], 150],
  [[KESTREL, HOSTING, 'System.IO.Pipelines.Pipe.FlushAsync'], 25],
  [['System.Threading.ThreadPoolWorkQueue.Dispatch', '[GC] gc_heap::garbage_collect'], 90],
];

/** The frame the candidate adds: a fraud screen that runs a regex per order line. */
const FRAUD: [string[], number] = [[...handler, PLACE, 'Shop.Api.FraudScreen.Evaluate', 'System.Text.RegularExpressions.Regex.IsMatch'], 85];

function fold(stacks: Array<[string[], number]>, seed: number, scale: (frames: string[]) => number = () => 1): string {
  const jitter = seeded(seed);
  return stacks
    .map(([frames, weight]) => {
      // ±2% run-to-run noise: under the diff's 5% threshold, as it should be.
      const noise = 1 + (jitter() - 0.5) * 0.04;
      return `${frames.join(';')} ${Math.round(weight * noise * scale(frames))}`;
    })
    .join('\n');
}

/** The baseline capture: 1,710-odd samples of the order handler. */
export const ordersProfileFolded = fold(STACKS, 7);

/**
 * The candidate capture: the response serializer about 30% slower (a converter
 * change), and a new fraud screen under `PlaceAsync`.
 */
export const ordersCandidateFolded = fold([...STACKS, FRAUD], 11, (frames) => (frames.includes(SERIALIZE) ? 1.3 : 1));

/** The id of the first frame named `name`, for stories that zoom or point at one. */
export function frameIdByName(tree: FlameTree, name: string): string | null {
  return tree.frames.find((frame) => frame.name === name)?.id ?? null;
}

export const SERIALIZER_FRAME = SERIALIZE;
export const PLACE_ORDER_FRAME = PLACE;
