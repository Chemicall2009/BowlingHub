def calc_sum256(data):
    return sum(data) % 256
def calc_xor(data):
    res = 0
    for b in data:
        res ^= b
    return res
def calc(data, variant="sum256"):
    return calc_sum256(data) if variant == "sum256" else calc_xor(data)
