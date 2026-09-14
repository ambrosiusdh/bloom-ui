# UXR-A10 — Checkout and post-checkout printing

Status: `EVIDENCE_COMPLETE`  
Audit date: 2026-09-14 (`Asia/Jakarta`)  
Live environment: frontend `http://localhost:5173`, backend `http://localhost:8080`  
Evidence directory: [`docs/ux/evidence/uxr-a10`](../evidence/uxr-a10/)

## Scope and conclusion

This was a live audit of the implemented cashier checkout and backend-controlled receipt-print workflow only. It exercised CASH and QRIS separately, empty tender validation, confirmation, the frozen confirmation/pending boundary, safe server payment and stock rejections, two successful disposable sales, backend-confirmed totals/tender/change, cart clearing, automatic printing, reprint from checkout and sale detail, navigation to sale detail, and session cleanup.

The core transaction boundary is sound. A sale is established from the backend response before printing begins, cart clearing occurs only for that confirmed sale, and every print action accepts only the confirmed sale code. No print or reprint control can invoke sale creation. Dangerous ambiguity, same-key payload conflict, duplicate clicks, and cross-route print races were not forced live; the existing focused tests passed and are labelled separately below.

The largest UX gap is pre-confirmation amount comprehension. The checkout deliberately avoids calculating a browser-authoritative total, but there is no server preview either. An operator is asked to enter CASH or an exact QRIS amount without an amount-due value in the payment section or confirmation. The QRIS path therefore depends on mental arithmetic or a server rejection to discover a mismatch. This is a backend/product contract gap, not a recommendation to calculate totals locally.

## Evidence-source labels

- **LIVE-UI:** direct browser interaction at `localhost:5173`, including raw screenshots and accessibility-tree/focus observations.
- **SERVER-RECORD:** a sale/session detail reloaded from the backend-backed UI after reauthentication.
- **REPOSITORY:** current controller, DTO, service, frontend component/store, and error-mapping inspection.
- **AUTOMATED-SAFETY:** existing tests used only where forcing ambiguity, duplicate submission, printer disconnection, or route races live would be unsafe or misleading.
- **INFERENCE:** an evidence-backed UX implication, kept separate from observed facts.

## Authoritative contract inspected

- `docs/architecture/release-1-frontend-contract.md`: FE-20 and FE-21 require one stable checkout idempotency key, server totals/change, sale confirmation before print, and a separate sale-reference print coordinator.
- Frontend checkout: `src/components/cashier/CashierCheckout.jsx`, `src/components/cashier/sale-checkout.js`, `src/pages/cashier/Cashier.jsx`.
- Frontend print and detail: `src/stores/modules/sale.js`, `src/api/sale.js`, `src/utils/receipt-print.js`, `src/pages/sale/SaleDetail.jsx`.
- Backend: `SaleController`, `PrintController`, `CreateSaleRequest`, `CreateSaleItemRequest`, `PrintReceiptRequest`, `SaleResponse`, `SaleCheckoutStatusResponse`, `SaleServiceImpl`, and `PrintServiceImpl` in the Bloom backend repository.

The backend accepts STORE line intent plus `discountAmount`, `paidAmount`, and `paymentType`; it owns stock locking, aggregation, prices, totals, payment validation, change, sale persistence, cash/stock movements, idempotency, and checkout-status lookup. Printing is a separate `POST /api/print` with only `saleCode`.

## Disposable fixtures and resulting records

| Fixture | Purpose | Starting live fact | Result |
| --- | --- | --- | --- |
| Session `#13`, opening `Rp 0` | Two successful sales and printing | Verified open, owned by `admin` | Closed at 07:21; server expected/actual `Rp 100.000`, variance `Rp 0` |
| Triplek (`BB-00001`) | CASH sale | Active; STORE showed 50 pcs; unit price `Rp 100.000` | Sold 1 pcs in `SALE/IX-2026/0002`; later STORE showed 49 pcs |
| Batu Bata (`BB-00002`) | QRIS sale | Active; STORE showed 399 pcs; unit price `Rp 1.000` | Sold 1 pcs in `SALE/IX-2026/0003` |
| Tes Scanner E81W (`8998824554842`) | Safe insufficient-stock rejection | Active whole-unit item; STORE `0 pcs` | Rejected by server; cart line removed; no sale created |
| Session `#14`, opening `Rp 0` | Re-capture validation/conflict evidence without another sale | Verified open, owned by `admin` | Closed at 08:08; server expected/actual `Rp 0`, variance `Rp 0` |

## Scenario results

### 1. No-session gate and disposable session setup

- **LIVE-UI fact:** with no open session, search and cart entry were disabled and the page instructed the operator to open a session. Evidence: [05](../evidence/uxr-a10/05-no-open-session-gate-wide.jpg).
- **LIVE-UI fact:** session `#14` opening used `Rp 0`; the form and backend-confirmed open state are preserved in [06](../evidence/uxr-a10/06-session-14-open-confirmation-wide.jpg) and [07](../evidence/uxr-a10/07-session-14-open-verified-wide.jpg).
- **Assessment:** session gating is explicit and compatible with the checkout invariant.

### 2. CASH tender and local validation

- **LIVE-UI fact:** adding Triplek exposed the CASH method, `Uang tunai diterima`, a Rupiah editing field, the STORE line intent, and copy that totals/change are server-owned. Evidence: [08](../evidence/uxr-a10/08-cash-checkout-form-wide.jpg).
- **LIVE-UI fact:** submitting an empty field returned `Jumlah pembayaran wajib diisi.` and focused the tender field. Evidence: [09](../evidence/uxr-a10/09-cash-empty-tender-validation-wide.jpg).
- **LIVE-UI fact:** a positive but underpaid `Rp 1` was allowed to confirmation because the browser does not know the total. The modal showed payment method, submitted amount, line count, and server-authority copy. Evidence: [10](../evidence/uxr-a10/10-cash-confirmation-frozen-wide.jpg).
- **LIVE-UI fact:** the server rejected the underpayment with `Pembayaran ditolak server. Masukkan nominal tunai yang sesuai lalu konfirmasi lagi.` and retained the cart and tender. Evidence: [11](../evidence/uxr-a10/11-cash-backend-underpayment-wide.jpg).
- **Assessment:** validation recovery is safe, but amount-due comprehension is incomplete before submission (`CHECKOUT-01`).

### 3. CASH success, cart clearing, and print

- **LIVE-UI fact:** one CASH sale returned code `SALE/IX-2026/0002`, total `Rp 100.000`, paid `Rp 150.000`, and server change `Rp 50.000`. The cart cleared only after this response. The same success surface then showed a separate receipt-print status and a reprint control.
- **SERVER-RECORD fact:** after a full route reload, sale detail still reported session `#13`, `Selesai`, `Lunas`, CASH, Triplek 1 pcs from Toko, and the same total/paid/change. Evidence: [04](../evidence/uxr-a10/04-cash-sale-0002-detail-wide.jpg).
- **LIVE-UI fact:** automatic printing returned the application status `Struk berhasil dicetak.`. A checkout `Cetak ulang struk` action was exercised against the same sale reference; the transition completed too quickly for a raw pending frame.
- **Assessment:** the confirmed record and cart-clearing boundary match the contract. A backend print acknowledgment is genuine application success; this audit did not independently inspect paper output.

### 4. QRIS tender, mismatch, and success

- **LIVE-UI fact:** switching methods changed the field label to `Nominal QRIS terkonfirmasi` and explained that the operator must enter the amount already confirmed on the QRIS device. Evidence: [12](../evidence/uxr-a10/12-qris-checkout-form-wide.jpg).
- **LIVE-UI fact:** confirmation preserved QRIS and the entered `Rp 1`; the underlying search/cart/payment controls were frozen. Evidence: [13](../evidence/uxr-a10/13-qris-mismatch-confirmation-wide.jpg).
- **LIVE-UI fact:** the backend rejected a non-exact QRIS amount with `Pembayaran QRIS ditolak server. Periksa nominal terkonfirmasi lalu coba lagi.` while retaining the cart. Evidence: [14](../evidence/uxr-a10/14-qris-backend-mismatch-wide.jpg).
- **LIVE-UI fact:** a separate exact QRIS checkout returned `SALE/IX-2026/0003`, total/paid `Rp 1.000`, change `Rp 0`, cleared the cart, and received backend print success.
- **SERVER-RECORD fact:** a later reload confirmed session `#13`, QRIS, Batu Bata 1 pcs from Toko, total/paid `Rp 1.000`, and change `Rp 0`. Evidence: [02](../evidence/uxr-a10/02-qris-sale-0003-detail-wide.jpg).
- **Assessment:** CASH and QRIS are distinguishable and backend validation is correct. Exact QRIS entry is unnecessarily discovery-driven without an amount-due preview (`CHECKOUT-01`).

### 5. Frozen confirmation and pending behavior

- **LIVE-UI fact:** confirmation disables search, result action, cart editing, payment method, tender, and review controls; focus begins on `Batal`. Evidence: [10](../evidence/uxr-a10/10-cash-confirmation-frozen-wide.jpg) and [13](../evidence/uxr-a10/13-qris-mismatch-confirmation-wide.jpg).
- **LIVE-UI fact:** `Mengirim transaksi satu kali...` was observed during the first checkout run, but localhost settled too quickly for the initially attempted raw pending capture to survive. No artificial network delay was introduced.
- **REPOSITORY fact:** phases `confirmation`, `submitting`, `checking`, and `unknown` are locked; the modal changes to `Memproses...`/`Memeriksa hasil...` and blocks cancel/confirm while pending.
- **AUTOMATED-SAFETY fact:** the deferred duplicate-safety tests passed and verify that pending disables the checkout, duplicate confirm clicks create one sale request, and the same exact request/key is retained during ambiguous recovery. Evidence: [automated test transcript](../evidence/uxr-a10/automated-safety-tests.txt).
- **Assessment:** the freeze is structurally strong. Literal live pending imagery is a documented evidence limitation, not relabelled from a settled frame.

### 6. Safe backend stock conflict

- **LIVE-UI fact:** the zero-STORE-stock whole-unit item showed an advisory before confirmation, while the modal correctly stated the server would recheck. Evidence: [15](../evidence/uxr-a10/15-zero-stock-confirmation-wide.jpg).
- **LIVE-UI fact:** the server rejected it with both `Stok berubah saat checkout...` and `Stok STORE tidak lagi cukup...`; the cart remained intact and no sale success appeared. Evidence: [16](../evidence/uxr-a10/16-zero-stock-backend-conflict-wide.jpg).
- **LIVE-UI focus fact:** after this rejection, focus moved to the top search field rather than either checkout error alert.
- **Assessment:** the mutation boundary is safe, but the focus destination can hide the actual recovery task from keyboard users (`CHECKOUT-02`).

### 7. Sale-first print sequencing and non-resubmission

- **REPOSITORY fact:** `completeSale` stores the backend sale, changes phase to `success`, and invokes the parent completion callback. The parent clears the cart only for that sale. Automatic `printReceipt(result.code)` is invoked from an effect that runs only after the success phase/result exists.
- **REPOSITORY fact:** the print store accepts only `saleCode`, guards a sale-scoped `PENDING` operation, calls `/api/print`, and never calls `createSale`. Checkout and detail reprint buttons both call that same print method.
- **LIVE-UI fact:** both completed checkouts showed sale success and print status as separate, ordered regions. Reprint never restored a tender/confirmation control or changed either sale code. Detail navigation preserved the reference.
- **AUTOMATED-SAFETY fact:** the existing tests explicitly assert sale success exists before print completion/status, automatic print is called once with the returned reference, reprint increases only print calls, and `createSale` remains at one call (or zero on detail). They also cover a shared pending print across navigation. Evidence: [automated test transcript](../evidence/uxr-a10/automated-safety-tests.txt).
- **Conclusion:** sale success precedes print status by implementation order, and print cannot resubmit a sale.

### 8. Genuine print success, reprint, and detail navigation

- **LIVE-UI fact:** the backend returned `data: true` for automatic print requests on both completed sales; the UI rendered `Struk berhasil dicetak.`. These were backend print calls, not `window.print`, PDF, or a browser fallback.
- **LIVE-UI fact:** reprint was exercised from the cashier success state and from QRIS sale detail. After reauthentication, QRIS detail reprint again returned success and focused its status. Evidence: [03](../evidence/uxr-a10/03-qris-detail-reprint-success-wide.jpg).
- **LIVE-UI fact:** `Lihat detail penjualan` navigated directly to `/sales/SALE%2FIX-2026%2F0003`; the page exposed the same reference, server statuses, session, tender, change, and line. Evidence: [02](../evidence/uxr-a10/02-qris-sale-0003-detail-wide.jpg).
- **AUTOMATED-SAFETY fact:** printer-not-found, network-uncertain print outcome, false backend acknowledgment, retry with the same sale, and route-race handling passed in existing tests. They were not induced against the live printer path.
- **Assessment:** sale/print separation and detail continuity are strong. Repeated successful print attempts are visually indistinguishable after completion (`CHECKOUT-03`).

### 9. Cleanup

- **LIVE-UI fact:** session `#13` was closed after both successful sales. The server showed expected/actual `Rp 100.000` and variance `Rp 0`. Evidence: [01](../evidence/uxr-a10/01-session-13-closed-cleanup-wide.jpg).
- **LIVE-UI fact:** session `#14` contained only rejected attempts. The zero-stock line was removed before close; the server preview was `Rp 0`, then final expected/actual/variance were all `Rp 0`. Evidence: [17](../evidence/uxr-a10/17-session-14-cleanup-preview-wide.jpg) and [18](../evidence/uxr-a10/18-session-14-cleanup-confirmed-wide.jpg).
- **Final state:** no disposable cart line or open cash session remains. Completed sale records and their stock/cash movements intentionally remain as the auditable result of the requested disposable transactions; the application exposes no return/delete cleanup and none was invented.

## Findings

No `P0` finding was observed.

| ID | Priority | Evidence type | Finding |
| --- | --- | --- | --- |
| CHECKOUT-01 | P1 | LIVE-UI + REPOSITORY + INFERENCE | Checkout asks for CASH tender or an exact QRIS amount without showing an amount due in the payment section or confirmation. The browser correctly refuses to authoritatively calculate it, but no server preview exists. Operators must mentally total unit-price lines or learn the amount through rejection, especially problematic for exact QRIS. |
| CHECKOUT-02 | P1 | LIVE-UI + INFERENCE | After the safe insufficient-stock rejection, focus returned to the search field while the actionable checkout error alerts were lower on the page. Keyboard and assistive-technology users can miss why checkout failed and what must change. |
| CHECKOUT-03 | P2 | LIVE-UI + INFERENCE | Automatic print and later reprints end in the same sale-scoped `Struk berhasil dicetak.` state without an attempt label, count, or timestamp. After a fast reprint, the screen does not communicate whether the latest click produced a new acknowledged job or is showing the previous success. |

## Preserved strengths

- Backend ownership is explicit in the form, confirmation, response, detail, and error copy.
- CASH and QRIS labels, helper text, and server rules remain distinct.
- Known payment/stock failures preserve the operator’s cart and tender instead of implying a sale.
- Confirmation freezes all mutable cashier controls.
- Backend-confirmed code, total, paid amount, payment type, and change have strong hierarchy.
- Cart clearing is gated on a confirmed sale, not on submit start.
- Sale success remains visible independently of print pending/error/success.
- Printing and reprinting use only the confirmed reference; no browser/PDF fallback appeared.
- Navigation to detail preserves the exact encoded sale reference and backend facts.
- Existing tests cover the risky duplicate/ambiguity boundaries without manufacturing extra live sales.

## Recommendations, not implementation

1. Resolve `CHECKOUT-01` with an owner/backend decision for a non-mutating server checkout preview or another authoritative amount-due contract. Do not calculate or persist sale totals in the frontend.
2. Keep focus on the most specific checkout error (cart error or tender error) after a known backend rejection; do not let the general cashier search-focus restoration override it.
3. Distinguish the latest automatic print/reprint acknowledgment with a server-supported attempt timestamp or clearly transient “reprint completed” message if the backend contract can support it. Do not invent physical-paper certainty.
4. Preserve the current sale-first, separate-print coordinator and idempotent checkout recovery in any redesign.

## Owner decisions needed

1. Is an authoritative, non-posting server checkout preview in Release 1 scope, particularly for exact QRIS amount entry?
2. Should a successful backend print call be labelled as “sent/acknowledged by server” unless physical output can be verified, or is current `Struk berhasil dicetak` approved terminology?
3. Does operations need reprint attempt time/count, or is focused per-sale success sufficient?

## State-changing actions and cleanup ledger

| Time (Asia/Jakarta) | Action | Submitted values | Server/UI result | Cleanup |
| --- | --- | --- | --- | --- |
| 07:15 | Opened cash session `#13` | Opening cash `0` | Open, `admin` | Closed 07:21 |
| 07:16 | CASH underpayment attempt | Triplek 1 pcs; CASH `1` | Server rejected; no sale | Same cart corrected |
| 07:17 | CASH sale | Triplek 1 pcs; CASH `150000` | `SALE/IX-2026/0002`; total `100000`, paid `150000`, change `50000` | Cart cleared by confirmed success; record retained |
| 07:17–07:18 | CASH print actions | Automatic print, then checkout reprint using `SALE/IX-2026/0002` | Backend success status | No sale resubmission |
| 07:18 | QRIS mismatch attempt | Batu Bata 1 pcs; QRIS `1` | Server rejected; no sale | Same cart corrected |
| 07:19 | QRIS sale | Batu Bata 1 pcs; QRIS `1000` | `SALE/IX-2026/0003`; total/paid `1000`, change `0` | Cart cleared by confirmed success; record retained |
| 07:19–08:06 | QRIS print actions | Automatic print and sale-detail reprints using `SALE/IX-2026/0003` | Backend success status | No sale resubmission |
| 07:20 | Insufficient-stock attempt | Tes Scanner E81W 1 pcs; CASH `1000` | Server rejected; no sale | Cart line removed |
| 07:21 | Closed session `#13` | Server preview `100000`; actual `100000` | Closed; variance `0` | No open session |
| 08:06 | Opened cash session `#14` | Opening cash `0` | Open, `admin` | Closed 08:08 |
| 08:07 | Re-captured CASH/QRIS known rejections | Triplek 1 pcs; submitted `1` in each method | Both rejected; no sale | Triplek removed |
| 08:08 | Re-captured stock rejection | Tes Scanner E81W 1 pcs; CASH `1000` | Server rejected; no sale | Item removed |
| 08:08 | Closed session `#14` | Server preview `0`; actual `0` | Closed; variance `0` | No open session |

## Limitations

- Local responses were too fast to preserve a literal raw screenshot of `submitting` or print `pending`; confirmation freeze is live imagery, and deferred pending/duplicate behavior is labelled `AUTOMATED-SAFETY`.
- A backend `true` print acknowledgment was genuinely returned. The audit did not independently inspect a printer queue or physical paper, so it does not generalize beyond the application/server result.
- Printer disconnection, network timeout, same-key payload collision, double-submit races, ambiguous checkout replay, and navigation during pending print were not forced live.
- No return/void/delete flow exists in this scope. The two requested completed sale records and their authoritative stock/cash movements remain in the disposable environment.
- No narrow-layout requirement was included in UXR-A10; responsive cashier/cart layout was covered in UXR-A09 and was not duplicated here.

## Evidence index

| Evidence | Source | State |
| --- | --- | --- |
| [01](../evidence/uxr-a10/01-session-13-closed-cleanup-wide.jpg) | LIVE-UI | Session #13 final reconciliation |
| [02](../evidence/uxr-a10/02-qris-sale-0003-detail-wide.jpg) | SERVER-RECORD | QRIS sale detail |
| [03](../evidence/uxr-a10/03-qris-detail-reprint-success-wide.jpg) | LIVE-UI | Detail reprint success |
| [04](../evidence/uxr-a10/04-cash-sale-0002-detail-wide.jpg) | SERVER-RECORD | CASH sale detail |
| [05](../evidence/uxr-a10/05-no-open-session-gate-wide.jpg) | LIVE-UI | No-session gate |
| [06](../evidence/uxr-a10/06-session-14-open-confirmation-wide.jpg) | LIVE-UI | Opening-cash input |
| [07](../evidence/uxr-a10/07-session-14-open-verified-wide.jpg) | LIVE-UI | Verified open session |
| [08](../evidence/uxr-a10/08-cash-checkout-form-wide.jpg) | LIVE-UI | CASH form and cart intent |
| [09](../evidence/uxr-a10/09-cash-empty-tender-validation-wide.jpg) | LIVE-UI | Empty CASH validation |
| [10](../evidence/uxr-a10/10-cash-confirmation-frozen-wide.jpg) | LIVE-UI | CASH confirmation and frozen background |
| [11](../evidence/uxr-a10/11-cash-backend-underpayment-wide.jpg) | LIVE-UI | Server CASH underpayment rejection |
| [12](../evidence/uxr-a10/12-qris-checkout-form-wide.jpg) | LIVE-UI | QRIS field/guidance |
| [13](../evidence/uxr-a10/13-qris-mismatch-confirmation-wide.jpg) | LIVE-UI | QRIS confirmation and frozen background |
| [14](../evidence/uxr-a10/14-qris-backend-mismatch-wide.jpg) | LIVE-UI | Server QRIS mismatch rejection |
| [15](../evidence/uxr-a10/15-zero-stock-confirmation-wide.jpg) | LIVE-UI | Advisory zero-stock confirmation |
| [16](../evidence/uxr-a10/16-zero-stock-backend-conflict-wide.jpg) | LIVE-UI | Server insufficient-stock rejection |
| [17](../evidence/uxr-a10/17-session-14-cleanup-preview-wide.jpg) | LIVE-UI | Zero-sale cleanup preview |
| [18](../evidence/uxr-a10/18-session-14-cleanup-confirmed-wide.jpg) | LIVE-UI | Session #14 closed and balanced |
| [Automated safety transcript](../evidence/uxr-a10/automated-safety-tests.txt) | AUTOMATED-SAFETY | 2 files, 22 existing tests passed |

