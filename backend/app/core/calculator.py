"""Расчёт предварительной стоимости. Манифест: docs/manifests/ui/calculator.md

Округление и минимум живут здесь, а не в интерфейсе: иначе сумма на странице
и сумма в заявке разойдутся."""

from decimal import ROUND_CEILING, Decimal

ROUND_TO = 1000


def round_up_to(value: Decimal, step: int = ROUND_TO) -> int:
    """Округляет вверх до шага: калькулятор даёт ориентир, а не точную смету."""
    if value <= 0:
        return 0
    rounded = (value / step).to_integral_value(rounding=ROUND_CEILING)
    return int(rounded) * step


def estimate(
    *,
    base_price: int,
    option_deltas: list[int],
    factor: Decimal,
) -> int:
    """Итог = (базовая цена + сумма опций) × коэффициент, вверх до 1000 ₽."""
    subtotal = Decimal(base_price) + Decimal(sum(d for d in option_deltas))
    total = subtotal * Decimal(factor)
    # Минимум — базовая цена услуги: опции не могут сделать дешевле.
    return max(round_up_to(total), base_price)
