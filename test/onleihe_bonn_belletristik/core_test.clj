(ns onleihe-bonn-belletristik.core-test
  (:require [clojure.test :refer :all]
            [onleihe-bonn-belletristik.core :refer :all]))

(def list-html-str (slurp "dev-resources/list.html"))
(def detail-html-str (slurp "dev-resources/detail.html"))

(deftest extract-data-from-list-and-detail-page
  (testing "should be 20 books"
    (is (= 20 (count (get-books list-html-str)))))
  (testing "link to next list page"
    (is (= "https://www.onleihe.de/bonn/frontend/mediaList,0-0-0-102-0-0-1-2004-400001-0-0.html#titlelist" 
           (get-next-link list-html-str))))
  (testing "should be correct data from first book of list"
    (let [book (first (get-books list-html-str))]
      (is (= "Drei Minuten" (:title book)))
      (is (= "Roslund, Anders" (:author book)))
      (is (= "https://www.onleihe.de/bonn/frontend/mediaInfo,0-0-986185602-200-0-0-0-0-400001-0-0.html" (:link book)))))
  (testing "should be correct data from detail page"
    (let [book (get-book-data detail-html-str)]
      (is (= "Thriller" (:subtitle book)))
      (is (= 2018 (:publishing-date book)))
      (is (= "Deutsch" (:language book)))
      (is (= 704 (:length book)))
      (is (= "Blanvalet Taschenbuch Verlag" (:publisher book)))
      (is (= "Belletristik & Unterhaltung, Krimi & Thriller, Thriller" (:categories book)))
      (is (= 28 (:ratings-count book)))
      (is (= 4 (:rating book)))
      (is (clojure.string/includes? (:abstract book) "Und der einzige Mensch, dem er sein Leben anvertrauen kann")))))

