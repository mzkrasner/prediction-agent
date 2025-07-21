import * as marketsDefs from "./markets/defs.js";
import * as marketsRelations from "./markets/relations.js";

const schema = {
  ...marketsDefs,
  ...marketsRelations,
};

export default schema;

// Export types and repositories for easy access
export * from "./markets/types";
export { MarketIntelligenceRepository } from "../repositories/market-intelligence";
export { TradeDecisionsRepository } from "../repositories/trade-decisions"; 