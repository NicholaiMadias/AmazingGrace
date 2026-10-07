import { defineConfig } from "vite";
import { resolve } from "path";
import { copyFileSync, cpSync, mkdirSync } from "fs";

export default defineConfig({
  // Use relative asset paths so the site works on GitHub Pages PR previews
  // (pr-<number>/ subdirectory URLs) as well as on the production domain. 
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      input: {
        main:              resolve(__dirname, "index.html"),
        contact:           resolve(__dirname, "contact/index.html"),
        matrix:            resolve(__dirname, "matrix.html"),
        arcade:            resolve(__dirname, "arcade/index.html"),
        arcadeMatrix:      resolve(__dirname, "arcade/matrix-of-conscience/index.html"),
        arcadeMatrixTerminal: resolve(__dirname, "arcade/matrix-of-conscience-terminal/index.html"),
        arcadeAtariLab:    resolve(__dirname, "arcade/atari-lab/index.html"),
        arcadeLoreArchive: resolve(__dirname, "arcade/lore-archive/index.html"),
        matrixConscienceIndex: resolve(__dirname, "matrix-of-conscience/index.html"),
        arcadeCertificates: resolve(__dirname, "arcade/certificates/index.html"),
        arcadeBibleStudy:  resolve(__dirname, "arcade/bible-study/index.html"),
        arcadeSyndicateSiege: resolve(__dirname, "arcade/syndicate-siege/index.html"),
        arcadeSevenStars:  resolve(__dirname, "arcade/seven-stars/index.html"),
        arcadeTowerDefense: resolve(__dirname, "arcade/tower-defense/index.html"),
        arcadeStarMatrix:  resolve(__dirname, "arcade/star-matrix/index.html"),
        arcadeStarMatch:   resolve(__dirname, "arcade/star-match/index.html"),
        arcadeTrinity:     resolve(__dirname, "arcade/trinity/index.html"),
        ministry:          resolve(__dirname, "ministry/index.html"),
        ministryBibleJourney: resolve(__dirname, "ministry/bible-journey.html"),
        ministryTheRedQueen:  resolve(__dirname, "ministry/the-red-queen.html"),
        ministries:             resolve(__dirname, "ministries/index.html"),
        ministriesSevenStarCanon: resolve(__dirname, "ministries/seven-star-canon.html"),
        stories:           resolve(__dirname, "stories/index.html"),
        storiesBlogArchitecturalSynthesis: resolve(__dirname, "stories/blog/architectural-js-synthesis.html"),
        "stories/blog/rebellion": resolve(__dirname, "stories/blog/rebellion.html"),
        storiesExposeMatrix: resolve(__dirname, "stories/expose-the-matrix/index.html"),
        storiesMatrix:      resolve(__dirname, "stories/matrix.html"),
        storiesNoahAndTheArk: resolve(__dirname, "stories/noah-and-the-ark/index.html"),
        storiesNexusPrime2087: resolve(__dirname, "stories/nexus-prime-2087/index.html"),
        storiesOurCovenant: resolve(__dirname, "stories/our-covenant-of-new-beginnings/index.html"),
        storiesMirrorPath: resolve(__dirname, "stories/mirror-path/index.html"),
        storiesCollapseEngine: resolve(__dirname, "stories/collapse-engine/index.html"),
        storiesRebellion2027: resolve(__dirname, "stories/rebellion2027/index.html"),
        storiesFixingCopilotRulesetBypass: resolve(__dirname, "stories/fixing-copilot-ruleset-bypass-errors/index.html"),
        storiesGithubBypassSetupApp: resolve(__dirname, "stories/github-bypass-setup-app/index.html"),
        libraryIndex:                resolve(__dirname, "library/index.html"),
        libraryExposeMatrix:         resolve(__dirname, "library/expose-the-matrix/index.html"),
        libraryNoahAndTheArk:        resolve(__dirname, "library/noah-and-the-ark/index.html"),
        libraryAmazingGraceCovenant: resolve(__dirname, "library/amazing-grace-covenant/index.html"),
        libraryOurCovenant:          resolve(__dirname, "library/our-covenant-of-new-beginnings/index.html"),
        libraryFixingCopilot:        resolve(__dirname, "library/fixing-copilot-ruleset-bypass-errors/index.html"),
        libraryGithubBypass:         resolve(__dirname, "library/github-bypass-setup-app/index.html"),
        audioLibrary:        resolve(__dirname, "audio-library/index.html"),
        storiesLampInWindow: resolve(__dirname, "stories/books/the-lamp-in-the-window.html"),
        storiesElla:       resolve(__dirname, "stories/characters/ella.html"),
        news:              resolve(__dirname, "news/index.html"),
        newsZykoLearn:     resolve(__dirname, "news/articles/zyko-learn.html"),
        newsFutureArticles: resolve(__dirname, "news/articles/future-articles.html"),
        support:           resolve(__dirname, "support/index.html"),
        privacy:           resolve(__dirname, "privacy.html"),
        arcadeRedirect:    resolve(__dirname, "arcade.html"),
        arcadeGeminiVanguard: resolve(__dirname, "arcade/gemini-vanguard/index.html"),
        arcadeNexusHud:    resolve(__dirname, "arcade/nexus-hud/index.html"),
        arcadeVirtueMatch: resolve(__dirname, "arcade/virtue-match/index.html"),
        arcadePortfolioCli: resolve(__dirname, "arcade/portfolio-cli.html"),
      },
      output: {
        manualChunks(id) {
          if (id.includes('firebase/firestore')) return 'firebase-firestore';
          if (id.includes('firebase/auth')) return 'firebase-auth';
          if (id.includes('firebase/app')) return 'firebase-core';
          if (id.includes('react-dom')) return 'react-dom';
          if (id.includes('react')) return 'react';
          if (id.includes('framer-motion')) return 'framer-motion';
        }
      }
    }
  },
  plugins: [
    {
      name: 'copy-library-json',
      closeBundle() {
        try {
          mkdirSync(resolve(__dirname, 'dist/stories'), { recursive: true });
          copyFileSync(
            resolve(__dirname, 'stories/library.json'),
            resolve(__dirname, 'dist/stories/library.json')
          );
          cpSync(
            resolve(__dirname, 'stories/chapter-34-package'),
            resolve(__dirname, 'dist/stories/chapter-34-package'),
            { recursive: true }
          );
          cpSync(
            resolve(__dirname, 'OST'),
            resolve(__dirname, 'dist/OST'),
            { recursive: true }
          );
          // Preserve legacy non-module arcade runtime scripts required by
          // syndicate-siege, lore-archive, and matrix-of-conscience-terminal pages.
          cpSync(
            resolve(__dirname, 'arcade/js'),
            resolve(__dirname, 'dist/arcade/js'),
            { recursive: true }
          );
          try {
            cpSync(
              resolve(__dirname, 'assets'),
              resolve(__dirname, 'dist/assets'),
              { recursive: true }
            );
            console.log('? Copied untracked assets directory to dist/assets/');
          } catch (e) {
            console.log('No untracked assets directory to copy.');
          }
          console.log('? Copied stories/library.json to dist/stories/');
          console.log('? Copied chapter-34-package and OST package files.');
          console.log('? Copied arcade runtime scripts to dist/arcade/js/');
        } catch (err) {
          console.error('Failed to copy build artifacts:', err);
        }
      }
    }
  ]
});
