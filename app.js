const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const state = {
  cart: JSON.parse(localStorage.getItem("shopzone_cart") || "[]"),
  wishlist: JSON.parse(localStorage.getItem("shopzone_wishlist") || "[]"),
  filter: "All",
  query: ""
};

const money = n => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
const save = () => {
  localStorage.setItem("shopzone_cart", JSON.stringify(state.cart));
  localStorage.setItem("shopzone_wishlist", JSON.stringify(state.wishlist));
};
const discount = p => Math.round((1 - p.price / p.oldPrice) * 100);

function productCard(p){
  const wished = state.wishlist.includes(p.id);
  return `<article class="product-card">
    <div class="product-image">
      <img src="${p.image}" alt="${p.name}" loading="lazy">
      <span class="discount">${discount(p)}% OFF</span>
      <button class="wish ${wished ? "active":""}" data-wish="${p.id}" aria-label="Wishlist">${wished ? "♥":"♡"}</button>
    </div>
    <div class="product-info">
      <small>${p.category}</small>
      <h3>${p.name}</h3>
      <div class="rating">★ ${p.rating}</div>
      <div class="price"><strong>${money(p.price)}</strong><del>${money(p.oldPrice)}</del></div>
      <button class="btn primary full add-cart" data-add="${p.id}">Add to Cart</button>
    </div>
  </article>`;
}

function renderProducts(){
  const q = state.query.toLowerCase().trim();
  const list = products.filter(p =>
    (state.filter === "All" || p.category === state.filter) &&
    (!q || `${p.name} ${p.category}`.toLowerCase().includes(q))
  );
  $("#productGrid").innerHTML = list.map(productCard).join("");
  $("#emptyState").classList.toggle("hidden", list.length !== 0);
}

function renderCounts(){
  $("#cartCount").textContent = state.cart.reduce((n,i)=>n+i.qty,0);
  $("#wishlistCount").textContent = state.wishlist.length;
}

function addToCart(id){
  const item = state.cart.find(i=>i.id===id);
  item ? item.qty++ : state.cart.push({id,qty:1});
  save(); renderCounts(); renderCart(); toast("Added to cart ✓");
}

function changeQty(id, delta){
  const item = state.cart.find(i=>i.id===id);
  if(!item) return;
  item.qty += delta;
  if(item.qty <= 0) state.cart = state.cart.filter(i=>i.id!==id);
  save(); renderCounts(); renderCart();
}

function renderCart(){
  if(!state.cart.length){
    $("#cartItems").innerHTML = `<div class="cart-empty"><div>🛒</div><h3>Your cart is empty</h3><p>Add something you love.</p></div>`;
    $("#cartSubtotal").textContent = money(0); return;
  }
  let total = 0;
  $("#cartItems").innerHTML = state.cart.map(i=>{
    const p = products.find(x=>x.id===i.id); total += p.price*i.qty;
    return `<div class="cart-item"><img src="${p.image}" alt="${p.name}"><div class="cart-item-info"><h4>${p.name}</h4><strong>${money(p.price)}</strong><div class="qty"><button data-minus="${p.id}">−</button><span>${i.qty}</span><button data-plus="${p.id}">+</button></div></div><button class="remove" data-remove="${p.id}">×</button></div>`;
  }).join("");
  $("#cartSubtotal").textContent = money(total);
}

function openCart(){ $("#cartDrawer").classList.add("open"); $("#overlay").classList.add("show"); renderCart(); }
function closeCart(){ $("#cartDrawer").classList.remove("open"); $("#overlay").classList.remove("show"); }

function toggleWishlist(id){
  state.wishlist.includes(id) ? state.wishlist = state.wishlist.filter(x=>x!==id) : state.wishlist.push(id);
  save(); renderCounts(); renderProducts(); toast(state.wishlist.includes(id) ? "Added to wishlist ♡" : "Removed from wishlist");
}

function openProduct(id){
  const p = products.find(x=>x.id===id);
  $("#modalContent").innerHTML = `<div class="modal-product"><img src="${p.image}" alt="${p.name}"><div><small>${p.category}</small><h2>${p.name}</h2><div class="rating">★ ${p.rating} / 5</div><p class="modal-price">${money(p.price)} <del>${money(p.oldPrice)}</del></p><p>Premium quality product with a clean, modern design. Fast delivery and easy 7-day returns included.</p><button class="btn primary" data-add-modal="${p.id}">Add to Cart</button></div></div>`;
  $("#productModal").classList.add("show");
}

function toast(message){ const t=$("#toast"); t.textContent=message; t.classList.add("show"); clearTimeout(window.toastTimer); window.toastTimer=setTimeout(()=>t.classList.remove("show"),2200); }

document.addEventListener("click", e=>{
  const add=e.target.closest("[data-add]"); if(add) addToCart(Number(add.dataset.add));
  const wish=e.target.closest("[data-wish]"); if(wish) toggleWishlist(Number(wish.dataset.wish));
  const plus=e.target.closest("[data-plus]"); if(plus) changeQty(Number(plus.dataset.plus),1);
  const minus=e.target.closest("[data-minus]"); if(minus) changeQty(Number(minus.dataset.minus),-1);
  const remove=e.target.closest("[data-remove]"); if(remove) { state.cart=state.cart.filter(i=>i.id!==Number(remove.dataset.remove)); save(); renderCounts(); renderCart(); }
  const card=e.target.closest(".product-card"); if(card && !e.target.closest("button")) openProduct(Number(card.querySelector("[data-add]").dataset.add));
  const modalAdd=e.target.closest("[data-add-modal]"); if(modalAdd){addToCart(Number(modalAdd.dataset.addModal)); $("#productModal").classList.remove("show");}
});

$$(".filter").forEach(b=>b.addEventListener("click",()=>{
  $$(".filter").forEach(x=>x.classList.remove("active")); b.classList.add("active");
  state.filter=b.dataset.filter; renderProducts();
}));
$$(".category-card").forEach(b=>b.addEventListener("click",()=>{
  state.filter=b.dataset.category; $$(".filter").forEach(x=>x.classList.toggle("active",x.dataset.filter===state.filter));
  $("#products").scrollIntoView({behavior:"smooth"}); renderProducts();
}));

$("#searchToggle").onclick=()=>{ $("#searchPanel").classList.toggle("open"); $("#searchInput").focus(); };
$("#searchInput").oninput=e=>{state.query=e.target.value; renderProducts();};
$("#clearSearch").onclick=()=>{$("#searchInput").value="";state.query="";renderProducts();};
$("#cartBtn").onclick=openCart; $("#closeCart").onclick=closeCart; $("#overlay").onclick=closeCart;
$("#closeModal").onclick=()=>$("#productModal").classList.remove("show");
$("#productModal").onclick=e=>{if(e.target.id==="productModal") $("#productModal").classList.remove("show");};
$("#menuBtn").onclick=()=>$("#mobileNav").classList.toggle("open");
$$(".mobile-nav a").forEach(a=>a.onclick=()=>$("#mobileNav").classList.remove("open"));

$("#wishlistBtn").onclick=()=>{
  if(!state.wishlist.length) return toast("Your wishlist is empty");
  state.query=""; state.filter="All"; $$(".filter").forEach(x=>x.classList.toggle("active",x.dataset.filter==="All"));
  $("#products").scrollIntoView({behavior:"smooth"});
  $("#productGrid").innerHTML=products.filter(p=>state.wishlist.includes(p.id)).map(productCard).join("");
};
$("#checkoutBtn").onclick=()=> state.cart.length ? toast("Checkout is ready — connect your payment gateway next.") : toast("Your cart is empty");
$("#newsletterForm").onsubmit=e=>{e.preventDefault();toast("Thanks! You're subscribed ✓");e.target.reset();};

renderProducts(); renderCounts(); renderCart();