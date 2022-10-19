function update_loggedin() {
    window.user ? ($("#formMustLogin").css("display", "none"), $("#formSolve").css("display", "")) : ($("#formMustLogin").css("display", ""), $("#formSolve").css("display", "none"))
}

function get_param(e) {
    for (var t, a = window.location.search.substring(1).split("&"), o = 0; o < a.length; o++)
        if ((t = a[o].split("="))[0] === e) return void 0 === t[1] || decodeURIComponent(t[1]);
    return null
}

function swal_error(e, t) {
    Swal.fire({
        icon: "error",
        title: "Error",
        text: e
    }).then(function() {
        t && t()
    })
}

function show_sponsors_table() {
    a = '<table class="table"><thead><tr><th scope="col">Action</th><th scope="col">Name</th><th scope="col">Value</th><th scope="col">Date</th></tr></thead><tbody>';
    for (var e = 0; e < window.sponsors.length; e++) var t = window.sponsors[window.sponsors.length - 1 - e],
        a = (a = (a = (a = (a += "<tr>") + `<th style="word-break:keep-all;" scope="row">${t.type}</th>`) + `<td>${t.from}</td>`) + `<td style="word-break:keep-all;">${t.value}</td>`) + `<td style="word-break:keep-all;">${t.date}</td>` + "</tr>";
    a += "</tbody></table>", Swal.fire({
        title: "Puzzle History",
        icon: "info",
        width: "500pt",
        html: a
    })
}
async function load_puzzle() {
    var e = get_param("id");
    e || swal_error("This puzzle does not exist. Redirecting...", function() {
        window.location.href = "top.html"
    }), await get_exchange_rates();
    try {
        window.puzzle_data = await Moralis.Web3API.token.getTokenIdMetadata({
            chain: window.CHAIN,
            token_id: e,
            address: window.NFT_CONTRACT_ADDRESS
        }), window.puzzle_data.metadata ? window.puzzle = JSON.parse(window.puzzle_data.metadata) : window.puzzle = await $.get(window.puzzle_data.token_uri)
    } catch {
        swal_error("This puzzle does not exist. Redirecting...", function() {
            window.location.href = "top.html"
        })
    }
    window.puzzle.treasurehunt != window.treasurehunt && swal_error("This puzzle is not compatible with this version of TreasureHu nt. Redirecting...", function() {
        window.location.href = "top.html"
    });
    var t, e = window.puzzle.reward_addr.toLowerCase() == window.puzzle_data.owner_of.toLowerCase(),
        a = await Moralis.Web3API.account.getNativeBalance({
            chain: window.CHAIN,
            address: window.puzzle.reward_addr
        }),
        a = (float_bal = parseFloat(a.balance) / 1e18, !e || float_bal < .9 * parseFloat(window.puzzle.reward_amount)),
        o = "Solved by unknown",
        e = parseFloat(float_bal.toFixed(4)),
        r = [],
        s = (a && (e = window.puzzle.reward_amount, t = 0), "unknown"),
        n = null,
        i = -1,
        l = 0;
    try {
        for (var d = "unknown", w = "unknown", c = await Moralis.Web3API.account.getTransactions({
                chain: window.CHAIN,
                address: window.puzzle.reward_addr,
                order: "asc"
            }), u = 0; u < c.total; u++) {
            var p, h, z, f, _, m, b = c.result[u];
            console.log(b), b.from_address.toLowerCase() == window.puzzle.reward_addr.toLowerCase() && b.input.toLowerCase().startsWith("0x736f6c7665723d") && (o = "Solved by " + (d = web3_bsc.utils.hexToString(b.input).replace("solver=", "")) + " at " + (w = new Date(b.block_timestamp).toLocaleString())), b.to_address.toLowerCase() == window.puzzle.reward_addr.toLowerCase() && (t += parseFloat(b.value), p = web3_bsc.utils.hexToString(b.input), h = new Date(b.block_timestamp).toLocaleString(), z = parseFloat((parseFloat(b.value) / 1e18).toFixed(4)), f = await format_currency(z), _ = "Sponsor", m = shorten_addr(b.from_address), p.startsWith("sponsor=") && (_ = "Sponsor", m = p.replace("sponsor=", ""), i < z && (i = z, n = m), l += 1), p.startsWith("creator=") && (_ = "Create", s = m = p.replace("creator=", "")), p.startsWith("puzzle creation") && (_ = "Creation", s = m), r.push({
                type: _,
                from: m,
                value: f,
                date: h
            }))
        }
        a && ($("#solvedBy").text(o), $("#solvedBy").css("display", ""), g = e, t && (g = await format_currency(parseFloat((parseFloat(t) / 1e18).toFixed(4)))), r.push({
            type: "Solve",
            from: d,
            value: "-" + g,
            date: w
        }))
    } catch {}
    window.sponsors = r, a && t && (e = parseFloat((parseFloat(t) / 1e18).toFixed(4))), window.puzzle.image.startsWith("https://ipfs.moralis.io") && ($("#puzzleArt").attr("src", window.puzzle.image), $("#puzzleArt").css("height", "")), $("#puzzleReward").text(await format_currency(e));
    var g = "Created by: <i>" + escape_text(s) + "</i>";
    return n && (g += ",&nbsp;&nbsp;Sponsored by: <i>" + escape_text(n) + "</i>"), 1 < l && (g += `&nbsp;<a href="#" onclick="show_sponsors_table()">and ${l-1} other` + (2 < l ? "s" : "") + "</a>"), $("#puzzleSubtitle").html(g), a ? ($("#rewardWrap").css("text-decoration", "line-through"), $("#rewardLink").css("display", "none"), $("#alreadySolved").css("display", ""), $("#sponsor").css("display", "none")) : $("#rewardLink").attr("href", window.BSCSCAN + "/address/" + window.puzzle.reward_addr), $("#puzzleDesc").text(window.puzzle.puzzle_description), window.puzzle.puzzle_graphic.startsWith("https://ipfs.moralis.io") && ($("#graphicLink").attr("href", window.puzzle.puzzle_graphic), $("#puzzleGraphic").attr("src", window.puzzle.puzzle_graphic), $("#puzzleGraphic").css("height", "")), $("#spinnerSection").css("display", "none"), $("#puzzleTitle").text(window.puzzle.puzzle_title), $("#puzzleSection").css("display", ""), console.log(a), console.log(window.puzzle), console.log(window.puzzle_data), 0
}
async function sponsor() {
    if (window.user) {
        var e = await Swal.fire({
            title: "Sponsor This Puzzle",
            text: "Thank you for sponsoring this puzzle. What amount (in BNB) would you like to contribute to this puzzle?",
            input: "text",
            confirmButtonText: "Confirm",
            allowOutsideClick: !1,
            showCancelButton: !0
        });
        if (!e.isDismissed) {
            for (e = parseFloat(e.value); !(1e-4 < e && e < 1e5);) {
                if ((e = await Swal.fire({
                        title: "Sponsor This Puzzle",
                        text: "Sponsor amount must be between 0.0001 and 100000 BNB",
                        input: "text",
                        confirmButtonText: "Confirm",
                        allowOutsideClick: !1,
                        showCancelButton: !0
                    })).isDismissed) return;
                e = parseFloat(e.value)
            }
            var t = await Swal.fire({
                title: "Sponsor This Puzzle",
                text: "Thank you for sponsoring this puzzle. Please provide a name or alias to show on the puzzle page! (40 chars max)",
                input: "text",
                confirmButtonText: "Confirm",
                allowOutsideClick: !1,
                showCancelButton: !0
            });
            if (!t.isDismissed) {
                for (t = t.value; 40 < t.length;) {
                    if ((t = await Swal.fire({
                            title: "Sponsor This Puzzle",
                            text: "Please provide a name or alias of less than 40 characters",
                            input: "text",
                            confirmButtonText: "Confirm",
                            allowOutsideClick: !1,
                            showCancelButton: !0
                        })).isDismissed) return;
                    t = t.value
                }
                var a = {
                    to: window.puzzle.reward_addr,
                    from: window.ethereum.selectedAddress,
                    value: web3_bsc.utils.toHex(Math.round(1e18 * e)),
                    data: web3_bsc.utils.toHex("sponsor=" + t)
                };
                await ethereum.request({
                    method: "eth_sendTransaction",
                    params: [a]
                });
                await Swal.fire({
                    title: "Sponsor This Puzzle",
                    text: "Thank you for sponsoring this puzzle. The updated puzzle value will be visible once the transaction is confirmed."
                })
            }
        }
    } else swal_error("Must be logged in to sponsor a puzzle.")
}
async function attempt_solve() {
    var e = $("#solution_box").val();
    if (e.length < 1) swal_error("Must enter a solution");
    else {
        var t, a = new(Moralis.Object.extend("attempt"));
        a.set("address", window.ethereum.selectedAddress), a.set("attempt", e), a.save();
        try {
            if (hash_str(e) != window.puzzle.solution_hash) return void swal_error("Incorrect solution");
            if (!(t = dec_with_key(window.puzzle.solution_reward, derive_key(e)))) return void swal_error("Incorrect solution");
            if (!t.startsWith("0x")) return void swal_error("Incorrect solution")
        } catch {
            return void swal_error("Incorrect solution")
        }
        a = window.puzzle.reward_addr.toLowerCase() == window.puzzle_data.owner_of.toLowerCase(), e = await Moralis.Web3API.account.getNativeBalance({
            chain: window.CHAIN,
            address: window.puzzle.reward_addr
        });
        if (float_bal = parseFloat(e.balance) / 1e18, !a || float_bal < .9 * parseFloat(window.puzzle.reward_amount)) Swal.fire({
            title: "Correct!",
            text: "That is the correct solution! However, this puzzle has already been solved and the reward claimed."
        }).then(function() {
            window.location.reload()
        });
        else {
            $("#innerPuzzleSection").css("display", "none"), $("#successSection").css("display", "");
            for (var o = (o = await Swal.fire({
                    title: "Success!",
                    text: 'You have correctly solved this puzzle! You may optionally provide a name or alias to show on the "solved" page for this puzzle! (40 chars max)',
                    input: "text",
                    confirmButtonText: "Confirm",
                    allowOutsideClick: !1
                })).value; 40 < o.length;) o = (o = await Swal.fire({
                title: "Success!",
                text: "Please provide a name or alias of less than 40 characters",
                input: "text",
                confirmButtonText: "Confirm",
                allowOutsideClick: !1
            })).value;
            o.length < 1 && (o = shorten_addr(window.user.get("ethAddress")));
            e = window.ethereum.selectedAddress;
            if (!e || e.length < 4) swal_error("There was an error. Please try again.", function() {
                window.location.reload()
            });
            else {
                var a = window.web3_bsc.eth.abi.encodeFunctionCall({
                        name: "safeTransferFrom",
                        type: "function",
                        inputs: [{
                            type: "address",
                            name: "from"
                        }, {
                            type: "address",
                            name: "to"
                        }, {
                            type: "uint256",
                            name: "tokenId"
                        }]
                    }, [window.puzzle.reward_addr, e, parseInt(window.puzzle_data.token_id)]),
                    a = await web3_bsc.eth.accounts.signTransaction({
                        from: window.puzzle.reward_addr,
                        to: window.NFT_CONTRACT_ADDRESS,
                        value: "0x00",
                        gasLimit: 4e5,
                        gasPrice: await web3_bsc.eth.getGasPrice(),
                        data: a
                    }, t),
                    r = parseInt(await web3_bsc.eth.getBalance(window.puzzle.reward_addr)),
                    s = await web3_bsc.eth.sendSignedTransaction(a.rawTransaction);
                for ($("#nftHash").text(s.transactionHash), $("#nftHash").attr("href", window.BSCSCAN + "/tx/" + s.transactionHash);;) {
                    if ((n = parseInt(await web3_bsc.eth.getBalance(window.puzzle.reward_addr))) < r) break;
                    console.log("Checking..."), await sleep(3e3)
                }
                var n = parseInt(await web3_bsc.eth.getBalance(window.puzzle.reward_addr)),
                    r = (n -= Math.round(8e4 * await web3_bsc.eth.getGasPrice()), parseInt(await web3_bsc.eth.getBalance(window.puzzle.reward_addr))),
                    a = await web3_bsc.eth.accounts.signTransaction({
                        from: window.puzzle.reward_addr,
                        to: e,
                        value: n,
                        gasLimit: 4e4,
                        gasPrice: await web3_bsc.eth.getGasPrice(),
                        data: web3_bsc.utils.toHex("solver=" + o)
                    }, t),
                    s = await web3_bsc.eth.sendSignedTransaction(a.rawTransaction);
                for ($("#rewardHash").text(s.transactionHash), $("#rewardHash").attr("href", window.BSCSCAN + "/tx/" + s.transactionHash), $("#nftTransfer").css("display", ""), $("#rewardTransfer").css("display", "");;) {
                    if ((n = parseInt(await web3_bsc.eth.getBalance(window.puzzle.reward_addr))) < r) break;
                    console.log("Checking..."), await sleep(3e3)
                }
                $("#dispenseReward").text("Reward has been sent to your wallet!")
            }
        }
    }
}
window.user = Moralis.User.current(), setInterval(update_loggedin, 500);