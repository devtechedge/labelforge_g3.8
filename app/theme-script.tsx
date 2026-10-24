export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `try{(function(){var t=localStorage.getItem('lf_theme');if(t==='dark'||(!t&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}})()}catch(e){}`,
      }}
    />
  );
}
