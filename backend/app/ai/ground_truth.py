def assign_label(transaction, is_fraud):

    transaction["label_is_fraud"] = is_fraud

    return transaction