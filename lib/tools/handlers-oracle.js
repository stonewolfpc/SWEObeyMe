/**
 * Oracle handler for motivational quotes
 */

let getRandomQuote;
export function setGetRandomQuote(fn) {
  getRandomQuote = fn;
}

/**
 * Query the Oracle for surgical wisdom
 */
export const oracleHandlers = {
  query_the_oracle: async (_args) => {
    const categories = ['SUCCESS', 'FAILURE', 'RECOVERY'];
    const randomCat = categories[Math.floor(Math.random() * categories.length)];
    return { content: [{ type: 'text', text: `[ORACLE]: ${getRandomQuote(randomCat)}` }] };
  },
};
