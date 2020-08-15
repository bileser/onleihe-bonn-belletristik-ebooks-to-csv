# onleihe-bonn-belletristik

Small but complete Clojure learing project. Reads [6.600 Belletristik-Ebooks from Onleihe Bonn](https://www.onleihe.de/bonn/frontend/mediaList,0-2-0-101-0-0-0-0-0-0-0.html) into a CSV file.

The biggest portion of work was to find the right HTML parsing library. I found [Hickory](https://github.com/davidsantiago/hickory) to be the easiest to use. There are good selectors for the hickory format the library parses HTML into. In the end the parsing is done with quite few and nicely organized code.

When I first looked at Clojure code it looked messy and chaotic. But now I can see the order and with indenting and the density of Clojure I can produce highly readable compact functions. Clojure feels good! Python being my favorite language in the last years feels lightweight in comparison to Clojure. Clojure has the Java background, a compiled language, but the REPL makes is easy to use interactively. It feels like having a good weight pencil in your hand.

## Usage

Run with Leiningen:
* lein run
* lein test

