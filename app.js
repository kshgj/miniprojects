/* app.js — main interactive logic for demo e-commerce */
(function(){
  // State
  let products = PRODUCTS.slice();
  let filtered = products.slice();
  let cart = JSON.parse(localStorage.getItem('shop_cart')||'{}');
  let wishlist = JSON.parse(localStorage.getItem('shop_wishlist')||'{}');
  const pageSize = 8;
  let currentPage = 1;

  // DOM refs
  const productGrid = document.getElementById('productGrid');
  const cartCount = document.getElementById('cartCount');
  const wishlistCount = document.getElementById('wishlistCount');
  const cartBtn = document.getElementById('cartBtn');
  const wishlistBtn = document.getElementById('wishlistBtn');
  const cartPanel = document.getElementById('cartPanel');
  const cartItems = document.getElementById('cartItems');
  const cartSummary = document.getElementById('cartSummary');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const closeCart = document.getElementById('closeCart');
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modalBody');
  const closeModal = document.getElementById('closeModal');
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const filterCategory = document.getElementById('filterCategory');
  const filterRating = document.getElementById('filterRating');
  const minPrice = document.getElementById('minPrice');
  const maxPrice = document.getElementById('maxPrice');
  const applyPrice = document.getElementById('applyPrice');
  const offerOnly = document.getElementById('offerOnly');
  const sortSelect = document.getElementById('sortSelect');
  const categoryList = document.getElementById('categoryList');
  const resultsInfo = document.getElementById('resultsInfo');
  const prevPage = document.getElementById('prevPage');
  const nextPage = document.getElementById('nextPage');
  const pageInfo = document.getElementById('pageInfo');
  const carousel = document.getElementById('carousel');
  const orderConfirm = document.getElementById('orderConfirm');
  const orderMessage = document.getElementById('orderMessage');
  const closeOrder = document.getElementById('closeOrder');

  // Initialize
  function init(){
    populateCategories();
    renderCarousel();
    applyFilters();
    updateCounts();
    attachEvents();
  }

  function populateCategories(){
    const cats = Array.from(new Set(products.map(p=>p.category)));
    filterCategory.innerHTML = `<option value="all">All</option>` + cats.map(c=>`<option value="${c}">${c}</option>`).join('');
    categoryList.innerHTML = ['All',...cats].map((c,i)=>`<li class="${i===0?'active':''}" data-cat="${c==='All'?'all':c}">${c}</li>`).join('');
    // category click
    categoryList.querySelectorAll('li').forEach(li=>{
      li.addEventListener('click', e=>{
        categoryList.querySelectorAll('li').forEach(x=>x.classList.remove('active'));
        li.classList.add('active');
        filterCategory.value = li.dataset.cat;
        applyFilters();
      })
    })
  }

  function renderCarousel(){
    const slides = [
      {title:'Big Winter Sale - Up to 50% off', img:'https://via.placeholder.com/800x360?text=Sale'},
      {title:'New Arrivals in Fashion', img:'https://via.placeholder.com/800x360?text=New+Arrivals'},
      {title:'Top Electronics Deals', img:'https://via.placeholder.com/800x360?text=Electronics+Deals'}
    ];
    carousel.innerHTML = '';
    slides.forEach((s,i)=>{
      const slide = document.createElement('div');
      slide.className = 'slide';
      slide.innerHTML = `<div class="slide-card">
        <img src="${s.img}" alt="${s.title}">
        <div><h2>${s.title}</h2><p style="color:var(--muted)">Explore curated deals and top brands.</p><button class="primary btn" data-slide="${i}">Shop Now</button></div>
      </div>`;
      carousel.appendChild(slide);
    });
    // basic auto-slide
    let idx = 0;
    setInterval(()=>{
      const slides = carousel.querySelectorAll('.slide');
      idx = (idx+1)%slides.length;
      slides.forEach((s,i)=> s.style.transform = `translateX(${(i-idx)*100}%)`);
    }, 4500);
  }

  function attachEvents(){
    searchBtn.addEventListener('click', ()=>{ applyFilters(); });
    searchInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter') applyFilters(); });
    filterCategory.addEventListener('change', applyFilters);
    filterRating.addEventListener('change', applyFilters);
    applyPrice.addEventListener('click', applyFilters);
    offerOnly.addEventListener('change', applyFilters);
    sortSelect.addEventListener('change', ()=>{ applySorting(); renderPage(1); });
    prevPage.addEventListener('click', ()=>{ if(currentPage>1) renderPage(currentPage-1); });
    nextPage.addEventListener('click', ()=>{ const max = Math.ceil(filtered.length/pageSize); if(currentPage<max) renderPage(currentPage+1); });
    cartBtn.addEventListener('click', ()=>{ openCart(); });
    wishlistBtn.addEventListener('click', ()=>{ openWishlist(); });
    closeCart.addEventListener('click', ()=>{ cartPanel.classList.add('hidden'); });
    closeModal.addEventListener('click', ()=>{ closeModalFunc(); });
    checkoutBtn.addEventListener('click', ()=>{ openCheckout(); });
    closeOrder.addEventListener('click', ()=>{ orderConfirm.classList.add('hidden'); });
  }

  function applyFilters(){
    const q = searchInput.value.trim().toLowerCase();
    const cat = filterCategory.value;
    const rating = Number(filterRating.value);
    const min = Number(minPrice.value) || 0;
    const max = Number(maxPrice.value) || Number.POSITIVE_INFINITY;
    const offers = offerOnly.checked;

    filtered = products.filter(p=>{
      if(q && !(p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))) return false;
      if(cat !== 'all' && p.category !== cat) return false;
      if(p.rating < rating) return false;
      if(p.price < min || p.price > max) return false;
      if(offers && !p.offer) return false;
      return true;
    });
    applySorting();
    renderPage(1);
  }

  function applySorting(){
    const s = sortSelect.value;
    filtered.sort((a,b)=>{
      if(s==='price-asc') return a.price - b.price;
      if(s==='price-desc') return b.price - a.price;
      if(s==='rating-desc') return b.rating - a.rating;
      return 0;
    });
  }

  function renderPage(page){
    currentPage = page;
    const start = (page-1)*pageSize;
    const pageItems = filtered.slice(start, start+pageSize);
    productGrid.innerHTML = pageItems.map(p=>productCard(p)).join('');
    pageInfo.textContent = `${page} / ${Math.max(1, Math.ceil(filtered.length/pageSize))}`;
    resultsInfo.textContent = `${filtered.length} results`;
    // attach product action handlers
    productGrid.querySelectorAll('.add-cart').forEach(btn=>{
      btn.addEventListener('click', e=>{ addToCart(e.target.dataset.id); });
    });
    productGrid.querySelectorAll('.quick-view').forEach(btn=>{
      btn.addEventListener('click', e=>{ openQuickView(e.target.dataset.id); });
    });
    productGrid.querySelectorAll('.wish-toggle').forEach(btn=>{
      btn.addEventListener('click', e=>{ toggleWishlist(e.target.dataset.id); });
    });
  }

  function productCard(p){
    return `
      <div class="product-card">
        <img src="${p.image}" alt="${p.title}" loading="lazy">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <h4 title="${p.title}">${p.title}</h4>
          <div style="font-size:13px;color:var(--muted)">${p.rating}★</div>
        </div>
        <div class="price-row">
          <div class="price">$${p.price.toFixed(2)}</div>
          ${p.oldPrice?`<div class="old-price">$${p.oldPrice.toFixed(2)}</div>`:''}
        </div>
        <div style="color:var(--muted);font-size:13px">${p.reviews} reviews</div>
        <div class="card-actions">
          <button class="btn btn-outline quick-view" data-id="${p.id}">Quick View</button>
          <button class="btn primary add-cart" data-id="${p.id}">Add to Cart</button>
          <button class="btn btn-outline wish-toggle" data-id="${p.id}">${wishlist[p.id] ? '♥' : '♡'}</button>
        </div>
      </div>
    `;
  }

  // Cart operations
  function addToCart(id, qty=1){
    if(!cart[id]) cart[id] = 0;
    cart[id] += qty;
    saveCart();
    updateCounts();
    openSmallToast("Added to cart");
  }

  function saveCart(){ localStorage.setItem('shop_cart', JSON.stringify(cart)); }
  function saveWishlist(){ localStorage.setItem('shop_wishlist', JSON.stringify(wishlist)); }

  function updateCounts(){
    const cartTotal = Object.values(cart).reduce((s,n)=>s+n,0);
    cartCount.textContent = cartTotal;
    const wishTotal = Object.keys(wishlist).length;
    wishlistCount.textContent = wishTotal;
    wishlistBtn.innerHTML = `Wishlist <span id="wishlistCount" class="count">${wishTotal}</span>`;
    cartBtn.innerHTML = `Cart <span id="cartCount" class="count">${cartTotal}</span>`;
  }

  function openQuickView(id){
    const p = products.find(x=>x.id===id);
    modalBody.innerHTML = `
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        <img src="${p.image}" alt="${p.title}" style="width:280px; height:200px; object-fit:cover; border-radius:10px">
        <div style="flex:1">
          <h2>${p.title}</h2>
          <div style="color:var(--muted)">${p.rating}★ • ${p.reviews} reviews</div>
          <p style="font-weight:700;margin:8px 0;">$${p.price.toFixed(2)} ${p.oldPrice?`<span style="text-decoration:line-through;color:var(--muted)">$${p.oldPrice.toFixed(2)}</span>`:''}</p>
          <p style="color:var(--muted)">${p.description}</p>
          <div style="display:flex;gap:8px;margin-top:12px">
            <button class="primary btn" id="modalAdd" data-id="${p.id}">Add to Cart</button>
            <button class="btn btn-outline" id="modalWish" data-id="${p.id}">${wishlist[p.id] ? 'Remove Wish' : 'Add Wish'}</button>
          </div>
        </div>
      </div>
    `;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden','false');
    document.getElementById('modalAdd').addEventListener('click', e=>{ addToCart(e.target.dataset.id); });
    document.getElementById('modalWish').addEventListener('click', e=>{ toggleWishlist(e.target.dataset.id); });
  }

  function closeModalFunc(){ modal.classList.add('hidden'); modal.setAttribute('aria-hidden','true'); }

  function toggleWishlist(id){
    if(wishlist[id]) delete wishlist[id];
    else wishlist[id] = Date.now();
    saveWishlist();
    updateCounts();
    renderPage(currentPage);
    openSmallToast(wishlist[id] ? "Added to wishlist" : "Removed from wishlist");
  }

  function openCart(){
    renderCartPanel();
    cartPanel.classList.remove('hidden');
  }

  function openWishlist(){
    // show wishlist as modal quick listing
    const items = Object.keys(wishlist).map(id => products.find(p=>p.id===id)).filter(Boolean);
    modalBody.innerHTML = items.length ? items.map(p=>`<div style="display:flex;gap:12px;padding:8px;border-bottom:1px solid #f0f1f6"><img src="${p.image}" style="width:80px;height:60px;object-fit:cover"/><div style="flex:1"><strong>${p.title}</strong><div style="color:var(--muted)">$${p.price.toFixed(2)}</div></div><div style="display:flex;flex-direction:column;gap:6px"><button class="primary btn" data-id="${p.id}" onclick="(function(){document.querySelector('#modalAdd')?.click()})()">Buy</button><button class="btn btn-outline" data-id="${p.id}" onclick="(function(){document.querySelector('#modalClose')?.click()})()">Remove</button></div></div>`).join('') : '<p style="color:var(--muted)">No items in wishlist</p>';
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden','false');
  }

  function renderCartPanel(){
    if(Object.keys(cart).length===0){
      cartItems.innerHTML = '<p style="color:var(--muted)">Your cart is empty.</p>';
      cartSummary.innerHTML = '';
      return;
    }
    cartItems.innerHTML = Object.entries(cart).map(([id,qty])=>{
      const p = products.find(x=>x.id===id);
      return `<div class="cart-item">
        <img src="${p.image}" alt="${p.title}">
        <div style="flex:1">
          <div style="font-weight:600">${p.title}</div>
          <div style="color:var(--muted);font-size:13px">$${p.price.toFixed(2)} • ${p.rating}★</div>
          <div class="qty-controls" style="margin-top:8px">
            <button class="btn btn-outline" data-id="${id}" data-action="dec">-</button>
            <div>${qty}</div>
            <button class="btn btn-outline" data-id="${id}" data-action="inc">+</button>
            <button class="btn btn-outline" data-id="${id}" data-action="remove">Remove</button>
          </div>
        </div>
      </div>`;
    }).join('');
    // attach quantity handlers
    cartItems.querySelectorAll('.btn').forEach(b=>{
      b.addEventListener('click', e=>{
        const id = e.target.dataset.id;
        const act = e.target.dataset.action;
        if(act==='inc') cart[id] = (cart[id]||0)+1;
        if(act==='dec'){ cart[id] = (cart[id]||1)-1; if(cart[id]<=0) delete cart[id]; }
        if(act==='remove') delete cart[id];
        saveCart();
        renderCartPanel();
        updateCounts();
      });
    });

    const subtotal = Object.entries(cart).reduce((s,[id,q])=>{
      const p = products.find(x=>x.id===id); return s + (p.price * q);
    },0);
    cartSummary.innerHTML = `<div>Subtotal: <strong>$${subtotal.toFixed(2)}</strong></div>`;
  }

  function openCheckout(){
    if(Object.keys(cart).length===0){ openSmallToast('Cart is empty'); return; }
    // show a simple checkout form inside modal
    modalBody.innerHTML = `
      <h3>Checkout</h3>
      <form id="checkoutForm">
        <div style="display:flex;gap:8px;flex-direction:column">
          <input name="name" placeholder="Full name" required />
          <input name="email" type="email" placeholder="Email" required />
          <input name="address" placeholder="Shipping address" required />
          <input name="city" placeholder="City" required />
          <div style="display:flex;gap:8px"><input name="zip" placeholder="ZIP / Postal" required /><input name="phone" placeholder="Phone" required /></div>
        </div>
        <div style="margin-top:12px">
          <button type="submit" class="primary btn">Place Order</button>
        </div>
      </form>
    `;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden','false');
    document.getElementById('checkoutForm').addEventListener('submit', e=>{
      e.preventDefault();
      placeOrder(new FormData(e.target));
    });
  }

  function placeOrder(formData){
    // mock placing order
    const orderId = 'ORD' + Math.floor(Math.random()*900000+100000);
    const items = Object.entries(cart).map(([id,q])=>{
      const p = products.find(x=>x.id===id);
      return {id: p.id, title: p.title, qty: q, price: p.price};
    });
    // clear cart
    cart = {};
    saveCart();
    updateCounts();
    modal.classList.add('hidden');
    orderMessage.innerHTML = `Thanks ${formData.get('name') || ''}! Your order <strong>${orderId}</strong> has been placed. <br/>Items: ${items.length}`;
    orderConfirm.classList.remove('hidden');
  }

  function openSmallToast(msg){
    // tiny non-intrusive feedback (temporary)
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.position='fixed'; t.style.bottom='18px'; t.style.left='18px'; t.style.background='rgba(17,24,39,0.95)';
    t.style.color='white'; t.style.padding='10px 14px'; t.style.borderRadius='8px'; t.style.zIndex=999;
    document.body.appendChild(t);
    setTimeout(()=> t.remove(),1500);
  }

  // kick off
  init();

  // Expose a couple of helpers for debugging from console
  window.__shop = {products, filtered, cart, wishlist, addToCart, toggleWishlist};
})();