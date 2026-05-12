import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  // Use relative asset paths so the site works on GitHub Pages PR previews
  // (pr-<number>/ subdirectory URLs) as well as on the production domain.
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main:              resolve(__dirname, "index.html"),
        matrix:            resolve(__dirname, "matrix.html"),
        arcade:            resolve(__dirname, "arcade/index.html"),
        arcadeStarMatrix:   resolve(__dirname, "arcade/star-matrix/index.html"),
        arcadeMatrix:      resolve(__dirname, "arcade/matrix-of-conscience/index.html"),
        matrixConscienceIndex: resolve(__dirname, "matrix-of-conscience/index.html"),
        arcadeCertificates: resolve(__dirname, "arcade/certificates/index.html"),
        arcadeMatrixAct1:   resolve(__dirname, "arcade/matrix-act-1/index.html"),
        arcadeMatrixAct2:   resolve(__dirname, "arcade/matrix-act-2/index.html"),
        arcadeBibleStudy:  resolve(__dirname, "arcade/bible-study/index.html"),
        arcadeMatrixClassic: resolve(__dirname, "arcade/matrix-classic.html"),
        arcadeMatrixLegacy:  resolve(__dirname, "arcade/matrix-legacy/index.html"),
        arcadeMatrixDebug:   resolve(__dirname, "arcade/matrix-debug.html"),
        ministry:          resolve(__dirname, "ministry/index.html"),
        ministryBibleJourney: resolve(__dirname, "ministry/bible-journey.html"),
        ministries:             resolve(__dirname, "ministries/index.html"),
        ministriesSevenStarCanon: resolve(__dirname, "ministries/seven-star-canon.html"),
        stories:           resolve(__dirname, "stories/index.html"),
        storiesExposeMatrix: resolve(__dirname, "stories/expose-the-matrix/index.html"),
        storiesOurCovenant: resolve(__dirname, "stories/our-covenant-of-new-beginnings/index.html"),
        storiesBook1:      resolve(__dirname, "stories/books/storybook-1.html"),
        storiesBook2:      resolve(__dirname, "stories/books/storybook-2.html"),
        storiesElla:       resolve(__dirname, "stories/characters/ella.html"),
        matrixApp:         resolve(__dirname, "arcade/matrix-app/index.html"),
        news:              resolve(__dirname, "news/index.html"),
        newsZykoLearn:     resolve(__dirname, "news/articles/zyko-learn.html"),
        newsFutureArticles: resolve(__dirname, "news/articles/future-articles.html"),
        support:           resolve(__dirname, "support/index.html"),
        gallery1142:       resolve(__dirname, "galleries/1142-7th-street/index.html"),
        gallery1144:       resolve(__dirname, "galleries/1144-7th-street/index.html"),
        gallery926Tampa:   resolve(__dirname, "galleries/926-poinsettia/index.html"),
        galleryMinistry:   resolve(__dirname, "galleries/ministry/index.html"),
        privacy:           resolve(__dirname, "privacy.html"),
        arcadeRedirect:    resolve(__dirname, "arcade.html"),
      }
    }
  }
});
