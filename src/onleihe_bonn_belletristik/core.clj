(ns onleihe-bonn-belletristik.core
  (:gen-class)
  (:require [hickory.core :as hickory]
            [hickory.select :as s]
            [clojure.string :as string]
            [clojure.data.csv :as csv]
            [clojure.java.io :as io]))

(def base-url "https://www.onleihe.de/bonn/frontend/")

(defn get-elm [article class]
  (first (s/select (s/class class) article)))

(defn find-number-in-nodes [nodes]
  (first (for [node nodes :let [match (and (string? node) (re-find (re-matcher #"\d+" node)))] :when match]
           (Integer/parseInt match))))

(defn remove-whitespace-nodes [coll]
  (filter 
   (fn [v] (or (not (string? v)) (not (string/blank? v)))) 
   coll))

(defn get-book-data [detail-html-str]
  (let [hickory-doc (hickory/as-hickory (hickory/parse detail-html-str))]
    {:subtitle (let [ subtitle (-> (s/select (s/class "subtitle") hickory-doc) first :content)]
                 (if (= (count subtitle) 3) (last subtitle) ""))
     :publishing-date (-> (s/select (s/class "publishing-date") hickory-doc) 
                          first :content find-number-in-nodes)
     :publisher (-> (s/select (s/child (s/class "publisher") (s/tag "a")) hickory-doc)  first :content first)
     :length (-> (s/select (s/class "length")hickory-doc) 
                 first :content remove-whitespace-nodes find-number-in-nodes)
     :language (-> (s/select (s/class "title-language") hickory-doc)
                   first :content remove-whitespace-nodes last string/trim)
     :rating (- (count (s/select (s/child (s/class "average-user-vote") (s/class "ic_star")) hickory-doc))
                (count (s/select (s/child (s/class "average-user-vote") (s/class "grey")) hickory-doc)))
     :ratings-count (-> (s/select (s/class "user-vote") hickory-doc)
                        first :content remove-whitespace-nodes second :content find-number-in-nodes)
     :categories (clojure.string/join ", " 
                  (for [a (-> (s/select (s/child (s/class "category") (s/tag "a")) hickory-doc))] 
                    (-> a :content first)))
     :abstract (-> (s/select (s/child (s/class "abstract") (s/tag "p")) hickory-doc) second :content first str string/trim)
     :author-info (-> (s/select (s/child (s/class "author-info") (s/tag "p")) hickory-doc) 
                      second :content first str string/trim)}))

(defn get-next-link [list-html-str]
  (let [hickory-doc (hickory/as-hickory (hickory/parse list-html-str))
        elements (s/select (s/attr :title #(= "Seite weiter" %)) hickory-doc)]
    (if (> (count elements) 0)
      (str base-url (-> elements first :attrs :href))
      nil)))

(defn get-books [list-html-str]
  (let [hickory-doc (hickory/as-hickory (hickory/parse list-html-str))
        articles (s/select (s/tag :article) hickory-doc)]
    (for [book articles :let [count (count (s/select (s/class "ic_ebook") book))] :when (> count 0)]
      {:author (second (:content (get-elm book "author")))
       :title (second (:content (get-elm book "title-name")))
       :link (:href (:attrs (get-elm book "cover-link")))})))

(def next-link (atom (str base-url "mediaList,0-2-0-101-0-0-0-0-0-0-0.html")))
(def csv-data (atom []))
(def counter (atom 0))

(defn write-csv [path row-data]
  (let [columns [:author :title :subtitle :length :publisher :categories :abstract 
                 :author-info :rating :ratings-count :publishing-date :language :link]
        headers (map name columns)
        rows (mapv #(mapv % columns) row-data)]
    (with-open [file (io/writer path)]
      (csv/write-csv file (cons headers rows)))))

(defn -main
  [& args]
  (try
    (while @next-link
      (let [list-html (slurp @next-link) books (get-books list-html)]
        (println books)
        (doseq [book books]
          (swap! counter inc)
          (println @counter)
          (println (str base-url (:link book)))
          (let [book-details (get-book-data (slurp (str base-url (:link book))))]
            (swap! csv-data conj (merge book book-details))))
        (reset! next-link (get-next-link list-html))))
    (catch Exception ex
      (.printStackTrace ex)
      (str "caught exception: " (.getMessage ex))
      (write-csv "results.csv" @csv-data)))
  (write-csv "results.csv" @csv-data))
