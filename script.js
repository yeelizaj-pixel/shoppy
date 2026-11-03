
/* =====================================================
   SHOPMASTER - SISTEMA PRINCIPAL
   HTML5 + CSS3 + BOOTSTRAP + JAVASCRIPT
   API: Fake Store API
   ===================================================== */

const API_URL = "https://fakestoreapi.com/products";
const STORAGE_KEY = "shopmaster_carrito";

let productos = [];
let carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let productoSeleccionado = null;

const formatoDinero = (cantidad) =>
    new Intl.NumberFormat("es-DO", {
        style: "currency",
        currency: "USD"
    }).format(cantidad);

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[caracter]);
}

function imagenSegura(url) {
    try {
        const parsed = new URL(url);
        return ["https:", "http:"].includes(parsed.protocol)
            ? escaparHTML(parsed.href)
            : "";
    } catch {
        return "";
    }
}

/* =====================================================
   1. CARGAR PRODUCTOS DESDE LA API
   ===================================================== */

async function cargarProductos() {
    const contenedor = document.getElementById("productos");
    const loading = document.getElementById("loading");
    const error = document.getElementById("error");

    if (loading) loading.style.display = "block";
    if (error) error.style.display = "none";
    if (contenedor) contenedor.innerHTML = "";

    try {
        const respuesta = await fetch(API_URL);

        if (!respuesta.ok) {
            throw new Error("No se pudo conectar con la tienda.");
        }

        productos = await respuesta.json();

        if (!Array.isArray(productos) || productos.length === 0) {
            throw new Error("La tienda no devolvió productos.");
        }

        if (loading) loading.style.display = "none";

        mostrarProductos(productos);
    } catch (problema) {
        console.error("Error al cargar productos:", problema);

        if (loading) loading.style.display = "none";

        if (error) {
            error.style.display = "block";
            error.innerHTML = `
                <div class="alert alert-warning text-center">
                    <i class="fa-solid fa-triangle-exclamation me-2"></i>
                    No pudimos cargar los productos.
                    Comprueba tu conexión a Internet e inténtalo nuevamente.
                    <br>
                    <button class="btn btn-primary mt-3"
                        onclick="cargarProductos()">
                        <i class="fa-solid fa-rotate-right me-2"></i>
                        Reintentar
                    </button>
                </div>
            `;
        } else if (contenedor) {
            contenedor.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-warning">
                        No se pudieron cargar los productos.
                        <button class="btn btn-sm btn-primary ms-2"
                            onclick="cargarProductos()">Reintentar</button>
                    </div>
                </div>
            `;
        }
    }
}

/* =====================================================
   2. MOSTRAR PRODUCTOS
   ===================================================== */

function mostrarProductos(lista) {
    const contenedor = document.getElementById("productos");
    if (!contenedor) return;

    if (lista.length === 0) {
        contenedor.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fa-solid fa-box-open fa-3x text-secondary mb-3"></i>
                <h5>No encontramos productos.</h5>
                <p class="text-muted">Prueba con otra búsqueda o categoría.</p>
            </div>
        `;
        return;
    }

    contenedor.innerHTML = lista.map(producto => {
        const titulo = escaparHTML(producto.title);
        const categoria = escaparHTML(producto.category);
        const descripcion = escaparHTML(producto.description);
        const imagen = imagenSegura(producto.image);
        const precio = Number(producto.price) || 0;

        return `
            <div class="col-12 col-sm-6 col-lg-4 col-xl-3">
                <article class="product-card">
                    <div class="product-image">
                        <img src="${imagen}"
                            alt="${titulo}"
                            loading="lazy"
                            onerror="this.style.opacity='0.2'">
                    </div>

                    <span class="product-category">${categoria}</span>

                    <h3 class="product-title">${titulo}</h3>

                    <p class="product-description">
                        ${descripcion.slice(0, 105)}${descripcion.length > 105 ? "..." : ""}
                    </p>

                    <div class="product-price">
                        ${formatoDinero(precio)}
                    </div>

                    <div class="product-actions">
                        <button class="btn-details"
                            onclick="verDetalles(${Number(producto.id)})">
                            <i class="fa-solid fa-eye me-1"></i> Ver más
                        </button>

                        <button class="btn-add"
                            onclick="agregarAlCarrito(${Number(producto.id)}, 1)">
                            <i class="fa-solid fa-cart-plus me-1"></i> Agregar
                        </button>
                    </div>
                </article>
            </div>
        `;
    }).join("");
}

/* =====================================================
   3. BÚSQUEDA Y FILTROS
   ===================================================== */

function filtrarProductos() {
    const busqueda = (
        document.getElementById("busqueda")?.value || ""
    ).toLowerCase().trim();

    const categoriaActiva =
        document.querySelector("#categorias .category.active")?.dataset.cat
        || "all";

    const resultado = productos.filter(producto => {
        const coincideTexto =
            producto.title.toLowerCase().includes(busqueda) ||
            producto.description.toLowerCase().includes(busqueda) ||
            producto.category.toLowerCase().includes(busqueda);

        const coincideCategoria =
            categoriaActiva === "all" ||
            producto.category === categoriaActiva;

        return coincideTexto && coincideCategoria;
    });

    mostrarProductos(resultado);
}

function configurarFiltros() {
    const busqueda = document.getElementById("busqueda");

    if (busqueda) {
        busqueda.addEventListener("input", filtrarProductos);
    }

    document.querySelectorAll("#categorias .category").forEach(boton => {
        boton.addEventListener("click", () => {
            document.querySelectorAll("#categorias .category")
                .forEach(elemento => elemento.classList.remove("active"));

            boton.classList.add("active");
            filtrarProductos();
        });
    });
}

/* =====================================================
   4. DETALLES DEL PRODUCTO
   ===================================================== */

function verDetalles(id) {
    productoSeleccionado = productos.find(
        producto => Number(producto.id) === Number(id)
    );

    if (!productoSeleccionado) return;

    const detalle = document.getElementById("detalle");
    if (!detalle) return;

    const titulo = escaparHTML(productoSeleccionado.title);
    const descripcion = escaparHTML(productoSeleccionado.description);
    const categoria = escaparHTML(productoSeleccionado.category);
    const imagen = imagenSegura(productoSeleccionado.image);

    detalle.innerHTML = `
        <div class="row g-4 align-items-center">
            <div class="col-md-5">
                <img class="detail-image"
                    src="${imagen}"
                    alt="${titulo}">
            </div>

            <div class="col-md-7">
                <span class="product-category">${categoria}</span>
                <h3 class="fw-bold mt-2">${titulo}</h3>
                <p class="text-muted">${descripcion}</p>

                <div class="detail-price mb-3">
                    ${formatoDinero(Number(productoSeleccionado.price))}
                </div>

                <label for="cantidadDetalle" class="form-label">
                    Cantidad
                </label>

                <input type="number"
                    id="cantidadDetalle"
                    class="form-control mb-3"
                    value="1"
                    min="1"
                    max="99">

                <button class="btn-main w-100"
                    onclick="agregarDesdeDetalle()">
                    <i class="fa-solid fa-cart-plus"></i>
                    Agregar al carrito
                </button>
            </div>
        </div>
    `;

    bootstrap.Modal.getOrCreateInstance(
        document.getElementById("modalProducto")
    ).show();
}

function agregarDesdeDetalle() {
    if (!productoSeleccionado) return;

    const cantidad = Math.max(
        1,
        Math.min(99, Number(document.getElementById("cantidadDetalle")?.value) || 1)
    );

    agregarAlCarrito(productoSeleccionado.id, cantidad);

    bootstrap.Modal.getInstance(
        document.getElementById("modalProducto")
    )?.hide();
}

/* =====================================================
   5. CARRITO Y LOCALSTORAGE
   ===================================================== */

function guardarCarrito() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
}

function agregarAlCarrito(id, cantidad = 1) {
    const producto = productos.find(
        elemento => Number(elemento.id) === Number(id)
    );

    if (!producto) return;

    const existente = carrito.find(
        elemento => Number(elemento.id) === Number(id)
    );

    if (existente) {
        existente.cantidad = Math.min(99, existente.cantidad + cantidad);
    } else {
        carrito.push({
            id: producto.id,
            title: producto.title,
            price: Number(producto.price),
            image: producto.image,
            cantidad: Math.min(99, cantidad)
        });
    }

    guardarCarrito();
    actualizarCarrito();
}

function cambiarCantidad(id, cambio) {
    const producto = carrito.find(
        elemento => Number(elemento.id) === Number(id)
    );

    if (!producto) return;

    producto.cantidad += cambio;

    if (producto.cantidad <= 0) {
        carrito = carrito.filter(
            elemento => Number(elemento.id) !== Number(id)
        );
    } else {
        producto.cantidad = Math.min(99, producto.cantidad);
    }

    guardarCarrito();
    actualizarCarrito();
}

function eliminarDelCarrito(id) {
    carrito = carrito.filter(
        producto => Number(producto.id) !== Number(id)
    );

    guardarCarrito();
    actualizarCarrito();
}

function vaciarCarrito() {
    carrito = [];
    guardarCarrito();
    actualizarCarrito();
}

function calcularSubtotal() {
    return carrito.reduce(
        (total, producto) => total + producto.price * producto.cantidad,
        0
    );
}

function actualizarCarrito() {
    const lista = document.getElementById("listaCarrito");
    const contador = document.getElementById("contador");

    const unidades = carrito.reduce(
        (total, producto) => total + producto.cantidad,
        0
    );

    if (contador) contador.textContent = unidades;

    if (lista) {
        if (carrito.length === 0) {
            lista.innerHTML = `
                <div class="cart-empty">
                    <i class="fa-solid fa-cart-shopping"></i>
                    <h5>Tu carrito está vacío</h5>
                    <p>Agrega algunos productos para comenzar.</p>
                </div>
            `;
        } else {
            lista.innerHTML = carrito.map(producto => `
                <div class="cart-item">
                    <img src="${imagenSegura(producto.image)}"
                        alt="${escaparHTML(producto.title)}">

                    <div class="cart-item-info">
                        <h6>${escaparHTML(producto.title)}</h6>
                        <p>${formatoDinero(producto.price)}</p>

                        <div class="quantity-controls">
                            <button aria-label="Disminuir cantidad"
                                onclick="cambiarCantidad(${Number(producto.id)}, -1)">−</button>

                            <strong>${producto.cantidad}</strong>

                            <button aria-label="Aumentar cantidad"
                                onclick="cambiarCantidad(${Number(producto.id)}, 1)">+</button>

                            <button class="text-danger ms-auto"
                                aria-label="Eliminar producto"
                                onclick="eliminarDelCarrito(${Number(producto.id)})">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join("");
        }
    }

    const subtotal = calcularSubtotal();
    const impuesto = subtotal * 0.18;
    const total = subtotal + impuesto;

    const subtotalElemento = document.getElementById("subtotal");
    const impuestoElemento = document.getElementById("impuesto");
    const totalElemento = document.getElementById("total");

    if (subtotalElemento) subtotalElemento.textContent = formatoDinero(subtotal);
    if (impuestoElemento) impuestoElemento.textContent = formatoDinero(impuesto);
    if (totalElemento) totalElemento.textContent = formatoDinero(total);
}

/* =====================================================
   6. PROCESO DE PAGO SIMULADO
   ===================================================== */

function configurarPago() {
    const botonPagar = document.getElementById("pagar");
    const formulario = document.getElementById("formPago");

    if (botonPagar) {
        botonPagar.addEventListener("click", () => {
            if (carrito.length === 0) {
                alert("Tu carrito está vacío.");
                return;
            }

            const total = calcularSubtotal() * 1.18;
            const totalPago = document.getElementById("totalPago");

            if (totalPago) {
                totalPago.textContent = formatoDinero(total);
            }

            bootstrap.Offcanvas.getOrCreateInstance(
                document.getElementById("carrito")
            ).hide();

            bootstrap.Modal.getOrCreateInstance(
                document.getElementById("modalPago")
            ).show();
        });
    }

    if (formulario) {
        formulario.addEventListener("submit", evento => {
            evento.preventDefault();

            if (!formulario.checkValidity()) {
                formulario.reportValidity();
                return;
            }

            const nombre = document.getElementById("nombre").value.trim();
            const tarjeta = document.getElementById("tarjeta").value.replace(/\s/g, "");
            const fecha = document.getElementById("fecha").value.trim();
            const cvv = document.getElementById("cvv").value.trim();

            if (nombre.length < 3) {
                alert("Escribe tu nombre completo.");
                return;
            }

            if (!/^\d{16}$/.test(tarjeta)) {
                alert("La tarjeta de prueba debe contener 16 dígitos.");
                return;
            }

            if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(fecha)) {
                alert("Usa el formato MM/AA para el vencimiento.");
                return;
            }

            if (!/^\d{3,4}$/.test(cvv)) {
                alert("El CVV de prueba debe tener 3 o 4 dígitos.");
                return;
            }

            const datosTicket = crearTicket(nombre);

            bootstrap.Modal.getInstance(
                document.getElementById("modalPago")
            )?.hide();

            const ticket = document.getElementById("ticket");
            if (ticket) ticket.textContent = datosTicket.texto;

            vaciarCarrito();

            formulario.reset();

            bootstrap.Modal.getOrCreateInstance(
                document.getElementById("modalExito")
            ).show();
        });
    }
}

/* =====================================================
   7. GENERAR TICKET DE COMPRA
   ===================================================== */

let ultimoTicket = "";

function crearTicket(nombre) {
    const fecha = new Date().toLocaleString("es-DO");
    const subtotal = calcularSubtotal();
    const impuesto = subtotal * 0.18;
    const total = subtotal + impuesto;

    const lineas = [
        "================================",
        "          SHOPMASTER            ",
        "       TICKET DE COMPRA         ",
        "================================",
        `Fecha: ${fecha}`,
        `Cliente: ${nombre}`,
        "--------------------------------",
        "PRODUCTOS:"
    ];

    carrito.forEach(producto => {
        lineas.push(
            producto.title.slice(0, 28),
            `${producto.cantidad} x ${formatoDinero(producto.price)}`,
            `Importe: ${formatoDinero(producto.price * producto.cantidad)}`,
            "--------------------------------"
        );
    });

    lineas.push(
        `Subtotal: ${formatoDinero(subtotal)}`,
        `Impuesto (18%): ${formatoDinero(impuesto)}`,
        "================================",
        `TOTAL: ${formatoDinero(total)}`,
        "================================",
        "Pago simulado - Sin transacción real",
        "Gracias por comprar en SHOPMASTER",
        "        ¡Vuelve pronto!          "
    );

    ultimoTicket = lineas.join("\n");

    return {
        texto: ultimoTicket,
        fecha,
        nombre,
        total
    };
}

/* =====================================================
   8. DESCARGAR TICKET PDF
   ===================================================== */

function descargarPDF() {
    if (!ultimoTicket) {
        alert("No hay ningún ticket disponible.");
        return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert("No se pudo cargar la herramienta para crear PDF.");
        return;
    }

    const { jsPDF } = window.jspdf;

    const lineas = ultimoTicket.split("\n");
    const ancho = 80;
    const alto = Math.max(100, 18 + lineas.length * 5);

    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [ancho, alto]
    });

    pdf.setFont("courier", "normal");
    pdf.setFontSize(8);

    let posicionY = 10;

    lineas.forEach(linea => {
        const partes = pdf.splitTextToSize(linea, 70);

        partes.forEach(parte => {
            pdf.text(parte, 5, posicionY);
            posicionY += 4.5;
        });
    });

    pdf.save("Ticket-ShopMaster.pdf");
}

/* =====================================================
   9. INICIALIZACIÓN
   ===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    configurarFiltros();
    configurarPago();
    actualizarCarrito();
    cargarProductos();

    const botonVaciar = document.getElementById("vaciar");

    if (botonVaciar) {
        botonVaciar.addEventListener("click", () => {
            if (carrito.length === 0) return;

            if (confirm("¿Seguro que deseas vaciar el carrito?")) {
                vaciarCarrito();
            }
        });
    }

    const botonPDF = document.getElementById("descargarPDF");

    if (botonPDF) {
        botonPDF.addEventListener("click", descargarPDF);
    }
});

/* Funciones utilizadas desde los botones HTML */
window.cargarProductos = cargarProductos;
window.verDetalles = verDetalles;
window.agregarAlCarrito = agregarAlCarrito;
window.agregarDesdeDetalle = agregarDesdeDetalle;
window.cambiarCantidad = cambiarCantidad;
window.eliminarDelCarrito = eliminarDelCarrito;
window.vaciarCarrito = vaciarCarrito;
window.descargarPDF = descargarPDF;
