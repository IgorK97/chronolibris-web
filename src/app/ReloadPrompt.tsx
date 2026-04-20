// import { useRegisterSW } from 'virtual:pwa-register/react';

// function ReloadPrompt() {
//   const {
//     offlineReady: [offlineReady, setOfflineReady],
//     needRefresh: [needRefresh, setNeedRefresh],
//     updateServiceWorker,
//   } = useRegisterSW({
//     onRegistered(r) {
//       console.log('SW Registered: ' + r);
//     },
//     onRegisterError(error) {
//       console.error('SW registration error', error);
//     },
//   });

//   const close = () => {
//     setOfflineReady(false);
//     setNeedRefresh(false);
//   };

//   return (
//     <div className="pwa-toast-container">
//       {(offlineReady || needRefresh) && (
//         <div className="pwa-toast">
//           <div className="pwa-message">
//             {offlineReady ? (
//               <span>Приложение готово к работе офлайн</span>
//             ) : (
//               <span>Доступно обновление. Обновить?</span>
//             )}
//           </div>
//           {needRefresh && (
//             <button
//               className="pwa-refresh-btn"
//               onClick={() => updateServiceWorker(true)}
//             >
//               Обновить
//             </button>
//           )}
//           <button className="pwa-close-btn" onClick={() => close()}>
//             Закрыть
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

// export default ReloadPrompt;
