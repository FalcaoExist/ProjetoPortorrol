# SOLID.md

# Princípios SOLID aplicados ao backend FastAPI e frontend React

## S — Single Responsibility Principle (Responsabilidade Única)

Cada módulo ou classe deve ter apenas uma razão para mudar.

**Exemplo Certo:**

```python
# Backend: services/product_service.py
class ProductService:
    def __init__(self, repository):
        self.repository = repository

    def get_critical_products(self):
        products = self.repository.get_all()
        return [p for p in products if p.stock < p.min_stock]
```

```jsx
// Frontend: components/ProductList.jsx
function ProductList({ products }) {
    return (
        <ul>
            {products.map(p => <li key={p.id}>{p.name} - {p.stock}</li>)}
        </ul>
    );
}
```

**Exemplo Errado:**

```python
# Backend: product_service.py mistura SQL e lógica
class ProductService:
    def get_critical_products(self):
        products = db.session.query(Product).all()
        return [p for p in products if p.stock < p.min_stock]
```

```jsx
// Frontend: ProductList.jsx mistura fetch e renderização
function ProductList() {
    const [products, setProducts] = useState([]);
    fetch('/api/products').then(res => res.json()).then(setProducts);
    return (
        <ul>{products.map(p => <li key={p.id}>{p.name}</li>)}</ul>
    );
}
```

---

## O — Open/Closed Principle (Aberto para extensão, fechado para modificação)

**Exemplo Certo:**

```python
# Backend
class ProductService:
    def get_filtered_products(self, filter_strategy):
        return filter_strategy.apply(self.repository.get_all())
```

```jsx
// Frontend
function ProductList({ products, filter }) {
    const filtered = filter(products);
    return <ul>{filtered.map(p => <li key={p.id}>{p.name}</li>)}</ul>;
}
```

**Exemplo Errado:**

```python
# Backend alterando função sempre que precisar de filtro novo
def get_critical_products(): ...
def get_supplier_products(): ...
```

```jsx
// Frontend alterando componente toda vez que muda filtro
function ProductListCritical() {...}
function ProductListSupplier() {...}
```

---

## L — Liskov Substitution Principle

**Exemplo Certo:**

```python
class MockProductRepository(ProductRepositoryBase):
    def get_all(self):
        return [Product(name="Mock", stock=5)]
```

```jsx
function App({ ListComponent, data }) {
    return <ListComponent data={data} />;
}
```

**Exemplo Errado:**

```python
class MockProductRepository(ProductRepositoryBase):
    def get_all(self, extra_arg): ...  # muda assinatura, quebrando serviço
```

```jsx
function App() { return <TableList data={data} />; }
// trocar por CardList quebra App se props mudarem
```

---

## I — Interface Segregation Principle

**Exemplo Certo:**

```python
class ReadOnlyRepository:
    def get_all(self): ...
```

```jsx
function ReadOnlyDisplay({ item }) { ... }
function EditableDisplay({ item, onChange }) { ... }
```

**Exemplo Errado:**

```python
class ProductRepository:
    def get_all(self): ...
    def create(self): ...
    def update(self): ...  # classe gigante, misturando responsabilidades
```

```jsx
function ProductComponent({ item, canEdit }) {
    if(canEdit) {...} else {...} // mistura visual e edição
}
```

---

## D — Dependency Inversion Principle

**Exemplo Certo:**

```python
product_service = ProductService(SQLProductRepository())
```

```jsx
function App({ productService }) {
    useEffect(() => { productService.getAll().then(setProducts); }, []);
}
```

**Exemplo Errado:**

```python
# Backend sempre cria SQL direto dentro do serviço
class ProductService:
    def __init__(self):
        self.repository = SQLProductRepository()
```

```jsx
// Frontend sempre fetcha direto dentro do componente
function App() {
    fetch('/api/products').then(...);
}
```

---

## Benefícios diretos

* S: Facilita manutenção e debugging.
* O: Permite novas regras ou filtros sem retrabalho.
* L: Melhora testabilidade e flexibilidade.
* I: Evita dependências desnecessárias e componentes inchados.
* D: Deixa backend e frontend moduláveis e desacoplados.
