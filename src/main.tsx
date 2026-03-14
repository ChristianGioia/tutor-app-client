import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Global, css } from '@emotion/react'
import { Auth0Provider } from '@auth0/auth0-react'
import { BrowserRouter } from 'react-router-dom'
import { lightTokens, darkTokens, fonts } from './theme'
import App from './App.tsx'

const globalStyles = css`
  :root {
    --text: ${lightTokens.text};
    --text-h: ${lightTokens.textH};
    --bg: ${lightTokens.bg};
    --border: ${lightTokens.border};
    --code-bg: ${lightTokens.codeBg};
    --accent: ${lightTokens.accent};
    --accent-bg: ${lightTokens.accentBg};
    --accent-border: ${lightTokens.accentBorder};
    --social-bg: ${lightTokens.socialBg};
    --shadow: ${lightTokens.shadow};

    --sans: ${fonts.sans};
    --heading: ${fonts.heading};
    --mono: ${fonts.mono};

    font: 18px/145% ${fonts.sans};
    letter-spacing: 0.18px;
    color-scheme: light dark;
    color: ${lightTokens.text};
    background: ${lightTokens.bg};
    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;

    @media (max-width: 1024px) {
      font-size: 16px;
    }
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --text: ${darkTokens.text};
      --text-h: ${darkTokens.textH};
      --bg: ${darkTokens.bg};
      --border: ${darkTokens.border};
      --code-bg: ${darkTokens.codeBg};
      --accent: ${darkTokens.accent};
      --accent-bg: ${darkTokens.accentBg};
      --accent-border: ${darkTokens.accentBorder};
      --social-bg: ${darkTokens.socialBg};
      --shadow: ${darkTokens.shadow};
      color: ${darkTokens.text};
      background: ${darkTokens.bg};
    }

    #social .button-icon {
      filter: invert(1) brightness(2);
    }
  }

  #root {
    width: 1126px;
    max-width: 100%;
    margin: 0 auto;
    text-align: center;
    border-inline: 1px solid var(--border);
    min-height: 100svh;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  body {
    margin: 0;
  }

  h1,
  h2 {
    font-family: ${fonts.heading};
    font-weight: 500;
    color: var(--text-h);
  }

  h1 {
    font-size: 56px;
    letter-spacing: -1.68px;
    margin: 32px 0;
    @media (max-width: 1024px) {
      font-size: 36px;
      margin: 20px 0;
    }
  }

  h2 {
    font-size: 24px;
    line-height: 118%;
    letter-spacing: -0.24px;
    margin: 0 0 8px;
    @media (max-width: 1024px) {
      font-size: 20px;
    }
  }

  p {
    margin: 0;
  }

  code,
  .counter {
    font-family: ${fonts.mono};
    display: inline-flex;
    border-radius: 4px;
    color: var(--text-h);
  }

  code {
    font-size: 15px;
    line-height: 135%;
    padding: 4px 8px;
    background: var(--code-bg);
  }
`

const domain = import.meta.env.VITE_AUTH0_DOMAIN as string
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID as string
const callbackUrl = import.meta.env.VITE_AUTH0_CALLBACK_URL as string
const audience = import.meta.env.VITE_AUTH0_AUDIENCE as string | undefined

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Global styles={globalStyles} />
    <BrowserRouter>
      <Auth0Provider
        domain={domain}
        clientId={clientId}
        authorizationParams={{
          redirect_uri: callbackUrl,
          ...(audience ? { audience } : {}),
        }}
      >
        <App />
      </Auth0Provider>
    </BrowserRouter>
  </StrictMode>,
)
