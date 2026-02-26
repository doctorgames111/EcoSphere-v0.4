// simple notification system
function showNotification(message, type = 'error') {
  let wrapper = document.querySelector('.notification-wrapper');
  if (!wrapper) {
    wrapper = document.createElement('div');
    wrapper.className = 'notification-wrapper';
    document.body.appendChild(wrapper);
  }
  // slide wrapper down
  wrapper.style.top = '20px';

  const notif = document.createElement('div');
  notif.className = `notification ${type}`;
  notif.textContent = message;

  const timer = document.createElement('div');
  timer.className = 'timer';
  notif.appendChild(timer);

  wrapper.appendChild(notif);

  // start timer fill
  setTimeout(() => { timer.style.width = '100%'; }, 50);

  // after 5s move wrapper back up and remove notif
  setTimeout(() => {
    wrapper.style.top = '-100px';
    setTimeout(() => {
      if (wrapper.contains(notif)) wrapper.removeChild(notif);
    }, 500);
  }, 5050);
}
