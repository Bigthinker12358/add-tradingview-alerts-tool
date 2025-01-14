import fetch from "node-fetch";
import { ExchangeSymbol } from "../classes.js";
const BINANCEFUTURES = "binancefutures";
const BINANCE = "binance";
const BINANCEUS = "binanceus";
const BITTREX = "bittrex";
const COINBASE = "coinbase";
const FTX = "ftx";
export const exchangesAvailable = [BINANCEFUTURES, BINANCE, BINANCEUS, BITTREX, COINBASE, FTX];
const CONST_ALL = "all";
const fetchBittrex = async (quoteAsset) => {
    const resp = await fetch("https://api.bittrex.com/api/v1.1/public/getmarkets");
    const responseObject = await resp.json();
    const symbols = responseObject.result;
    const exchangeSymbols = [];
    for (const symbol of symbols) {
        if (symbol.IsActive && (quoteAsset === CONST_ALL || symbol.BaseCurrency === quoteAsset.toUpperCase())) {
            exchangeSymbols.push(new ExchangeSymbol("BITTREX", symbol.MarketCurrency, symbol.BaseCurrency));
        }
    }
    return exchangeSymbols;
};
const fetchCoinbase = async (quoteAsset) => {
    const resp = await fetch("https://api.pro.coinbase.com/products");
    const responseObject = await resp.json();
    const symbols = responseObject;
    const exchangeSymbols = [];
    for (const symbol of symbols) {
        if (!symbol.trading_disabled && symbol.status == "online" &&
            (quoteAsset === CONST_ALL || symbol.quote_currency === quoteAsset.toUpperCase())) {
            exchangeSymbols.push(new ExchangeSymbol("COINBASE", symbol.base_currency, symbol.quote_currency));
        }
    }
    return exchangeSymbols;
};
const fetchFtx = async (quoteAsset) => {
    const resp = await fetch("https://ftx.com/api/markets");
    const responseObject = await resp.json();
    const symbols = responseObject.result;
    const exchangeSymbols = [];
    for (const symbol of symbols) {
        if (symbol.enabled &&
            (quoteAsset === CONST_ALL || symbol.quoteCurrency === quoteAsset.toUpperCase())
            && symbol.quoteCurrency && symbol.baseCurrency) {
            exchangeSymbols.push(new ExchangeSymbol("FTX", symbol.baseCurrency, symbol.quoteCurrency));
        }
        else if (quoteAsset.toUpperCase() == "PERP" && symbol.enabled && symbol.name.endsWith("PERP")) {
            exchangeSymbols.push({
                exchange: "FTX",
                id: `FTX:${symbol.underlying}PERP`,
                baseAsset: symbol.baseCurrency || symbol.underlying,
                quoteAsset: symbol.quoteCurrency || "USD",
            });
        }
    }
    return exchangeSymbols;
};
const fetchBinanceFutures = async (quoteAsset) => {
    const url = "https://fapi.binance.com/fapi/v1/exchangeInfo";
    const resp = await fetch(url);
    const responseObject = await resp.json();
    const { symbols } = responseObject;
    const exchangeSymbols = [];
    const exchange = "BINANCE";
    for (const symbol of symbols) {
        if (symbol.status === "TRADING" && (quoteAsset === CONST_ALL || symbol.quoteAsset === quoteAsset.toUpperCase())) {
            exchangeSymbols.push(new ExchangeSymbol(exchange, symbol.baseAsset, symbol.quoteAsset, `${exchange.toUpperCase()}:${symbol.baseAsset}${symbol.quoteAsset}PERP`));
        }
    }
    return exchangeSymbols;
};
const fetchBinance = async (isUs, quoteAsset) => {
    const url = isUs ? "https://api.binance.us/api/v3/exchangeInfo" : "https://api.binance.com/api/v3/exchangeInfo";
    const resp = await fetch(url);
    const responseObject = await resp.json();
    const { symbols } = responseObject;
    const exchangeSymbols = [];
    const exchange = isUs ? "BINANCEUS" : "BINANCE";
    for (const symbol of symbols) {
        if (symbol.status === "TRADING" && (quoteAsset === CONST_ALL || symbol.quoteAsset === quoteAsset.toUpperCase())) {
            exchangeSymbols.push(new ExchangeSymbol(exchange, symbol.baseAsset, symbol.quoteAsset));
        }
    }
    return exchangeSymbols;
};
export const fetchPairsForExchange = async (exchange, quoteAsset = CONST_ALL) => {
    let symbolArray;
    switch (exchange) {
        case BINANCEFUTURES:
            symbolArray = await fetchBinanceFutures(quoteAsset);
            break;
        case BINANCE:
            symbolArray = await fetchBinance(false, quoteAsset);
            break;
        case BINANCEUS:
            symbolArray = await fetchBinance(true, quoteAsset);
            break;
        case FTX:
            symbolArray = await fetchFtx(quoteAsset);
            break;
        case COINBASE:
            symbolArray = await fetchCoinbase(quoteAsset);
            break;
        case BITTREX:
            symbolArray = await fetchBittrex(quoteAsset);
            break;
        default:
            console.error("No exchange exists: ", exchange);
            break;
    }
    return symbolArray;
};
//# sourceMappingURL=exchange-service.js.map