(function () {
  function applyFixedSidebarLayout() {
    let style = document.getElementById('v4-sidebar-fixed-layout-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'v4-sidebar-fixed-layout-style';
      document.head.appendChild(style);
    }

    style.textContent = `
      :root{--v4-sidebar-fixed-width:320px;}
      #sidebar.sidebar{
        position:fixed!important;
        top:0!important;
        left:0!important;
        bottom:0!important;
        width:var(--v4-sidebar-fixed-width)!important;
        min-width:var(--v4-sidebar-fixed-width)!important;
        max-width:var(--v4-sidebar-fixed-width)!important;
        height:100vh!important;
        z-index:999700!important;
        overflow:hidden!important;
      }
      #sidebar .v4-kommo-sidebar{
        height:calc(100vh - 28px)!important;
        max-height:calc(100vh - 28px)!important;
      }
      #sidebar .v4-sidebar-top{
        flex:0 0 auto!important;
      }
      #sidebar .v4-sidebar-scroll{
        flex:1 1 auto!important;
        min-height:0!important;
        overflow-y:auto!important;
        overflow-x:hidden!important;
        padding-bottom:14px!important;
      }
      #sidebar .v4-sidebar-footer{
        flex:0 0 auto!important;
        position:relative!important;
        bottom:auto!important;
        left:auto!important;
        right:auto!important;
        z-index:5!important;
        margin-top:0!important;
      }
      #main{
        margin-left:var(--v4-sidebar-fixed-width)!important;
        width:calc(100vw - var(--v4-sidebar-fixed-width))!important;
        max-width:calc(100vw - var(--v4-sidebar-fixed-width))!important;
        box-sizing:border-box!important;
      }
      body:has(#sidebar.sidebar) #main{
        margin-left:var(--v4-sidebar-fixed-width)!important;
      }
      @media(max-width:860px){
        :root{--v4-sidebar-fixed-width:288px;}
        #sidebar.sidebar{
          width:var(--v4-sidebar-fixed-width)!important;
          min-width:var(--v4-sidebar-fixed-width)!important;
          max-width:var(--v4-sidebar-fixed-width)!important;
        }
        #main{
          margin-left:var(--v4-sidebar-fixed-width)!important;
          width:calc(100vw - var(--v4-sidebar-fixed-width))!important;
          max-width:calc(100vw - var(--v4-sidebar-fixed-width))!important;
        }
      }
    `;
  }

  function start() {
    applyFixedSidebarLayout();
    window.addEventListener('resize', applyFixedSidebarLayout);
    window.addEventListener('v4:rbac:user-ready', applyFixedSidebarLayout);
    window.addEventListener('v4:growthpack:sources-ready', applyFixedSidebarLayout);
    const observer = new MutationObserver(applyFixedSidebarLayout);
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
    if (window.V4_BOOT_LOG) window.V4_BOOT_LOG('sidebar_fixed_layout', 'Sidebar fixa no viewport com usuario no rodape.');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
