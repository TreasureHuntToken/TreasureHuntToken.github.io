function update_loggedin() {
    window.in_progress || (window.user ? ($("#formMustLogin").css("display", "none"), $("#formCreatePuzzle").css("display", "")) : ($("#formMustLogin").css("display", ""), $("#formCreatePuzzle").css("display", "none")))
}

function swal_error(e) {
    Swal.fire({
        icon: "error",
        title: "Error",
        text: e
    })
}
async function create_puzzle() {
    var e = $("#title").val().trim();
    if (e.length < 5) swal_error("Title length too short");
    else if (60 < e.length) swal_error("Title length must be less than 60 characters");
    else {
        var r = $("#desc").val().trim();
        if (r.length < 2) swal_error("Must have a puzzle description");
        else if (5e3 < r.length) swal_error("Title length must be less than 5000 characters");
        else {
            var a = $("#soln").val().trim();
            if (a.length < 4) swal_error("Must have a puzzle solution of at least 4 characters");
            else if (5e3 < a.length) swal_error("Solution length must be less than 5000 characters");
            else {
                var s = $("#creator").val().trim();
                if (s.length < 1) swal_error("Must provide a puzzle creator name");
                else if (40 < s.length) swal_error("Puzzle creator must be less than 40 characters");
                else {
                    var t = parseFloat($("#puzzleReward").val());
                    if (isFinite(t))
                        if (1e-5 < t && t < 1e5)
                            if (0 == (n = $("#puzzleArt")[0].files).length) swal_error("Puzzle art is required");
                            else {
                                var n = n[0];
                                if (["image/gif", "image/jpeg", "image/png"].includes(n.type))
                                    if (0 == (i = $("#puzzleGraphic")[0].files).length) swal_error("Puzzle graphic is required");
                                    else {
                                        var o = "unlisted" == $("input[name=puzzleVisibility]:checked").val(),
                                            i = i[0];
                                        if (["image/gif", "image/jpeg", "image/png"].includes(i.type)) {
                                            window.in_progress = !0, $("#formCreatePuzzle").css("display", "none"), $("#sectionProgress").css("display", ""), $("#sectionProgress").html(""), progressLine("Uploading puzzle to blockchain... Please do not close this page."), progressLine("Uploading art...");
                                            var l, n = await uploadFile(n),
                                                i = (console.log(n), progressLine("Uploading graphic..."), await uploadFile(i)),
                                                d = (console.log(i), progressLine("Generating reward wallet..."), window.web3_bsc.eth.accounts.create()),
                                                s = (progressLine("Reward wallet address: " + d.address), progressLine("Reward recovery key (please retain the recovery key until the puzzle creation process has completed):<br> " + btoa(JSON.stringify({
                                                    pk: d.privateKey
                                                }))), progressLine("Sending reward BNB to reward wallet... <b>Please confirm the reward transaction through your wallet</b>"), {
                                                    to: d.address,
                                                    from: window.ethereum.selectedAddress,
                                                    value: web3_bsc.utils.toHex(Math.round(1e18 * t)),
                                                    data: web3_bsc.utils.toHex("creator=" + s),
                                                    gasLimit: 25e3
                                                }),
                                                s = await ethereum.request({
                                                    method: "eth_sendTransaction",
                                                    params: [s]
                                                }),
                                                s = (progressLine("Reward sent: BSC transaction <a target='_blank' href='" + window.BSCSCAN + "/tx/" + s + "'>" + s + "</a>"), "TreasureHunt: " + e),
                                                u = "NFT earned upon solving the TreasureHunt puzzle named '" + e + "' - see " + window.TREASURE_HUNT_URL,
                                                a = encrypt_soln(a, d.privateKey),
                                                s = (console.log(a), await uploadNFT(s, u, window.ethereum.selectedAddress, e, r, n, i, a[0], a[1], t, d.address, o));
                                            for (console.log(s), progressLine("Waiting for NFT to appear on blockchain...");;) {
                                                if (0 < (l = await Moralis.Web3API.account.getNFTsForContract({
                                                        chain: window.CHAIN,
                                                        address: d.address,
                                                        token_address: window.NFT_CONTRACT_ADDRESS
                                                    })).total) break;
                                                console.log("Checking..."), await sleep(6e3)
                                            }
                                            u = l.result[0].token_id;
                                            try {
                                                await Moralis.Web3API.token.reSyncMetadata({
                                                    chain: window.CHAIN,
                                                    address: window.NFT_CONTRACT_ADDRESS,
                                                    token_id: "" + u,
                                                    flag: "uri",
                                                    mode: "sync"
                                                })
                                            } catch {}
                                            progressLine("Puzzle minted: BSC transaction <a href='" + window.BSCSCAN + "/tx/" + s + "'>" + s + "</a>");
                                            e = "puzzle.html?id=" + u;
                                            progressLine("<h4>Congratulations! Your puzzle has been created.</h4>"), progressLine("<a href='" + e + "'>Click here to view your puzzle</a>"), progressLine("Would you like to <a href='create.html'>create another puzzle</a>?")
                                        } else swal_error("Puzzle graphic must be in PNG, JPG, or GIF form")
                                    }
                                else swal_error("Puzzle art must be in PNG, JPG, or GIF form")
                            }
                    else swal_error("Reward must be between 0.00001 and 100000 BNB");
                    else swal_error("Invalid reward")
                }
            }
        }
    }
}
async function uploadFile(e) {
    e = new Moralis.File(e.name, e);
    return await e.saveIPFS(), e.ipfs()
}
async function uploadNFT(e, r, a, s, t, n, o, i, l, d, u, c) {
    e = {
        name: e,
        description: r,
        image: n,
        puzzle_title: s,
        puzzle_description: t,
        puzzle_graphic: o,
        solution_hash: i,
        solution_reward: l,
        reward_amount: parseFloat(d.toFixed(4)).toString(),
        treasurehunt: window.treasurehunt,
        creator_addr: a,
        reward_addr: u,
        unlisted: c || !1
    };
    progressLine("Uploading metadata...");
    const w = new Moralis.File("metadata.json", {
        base64: btoa(JSON.stringify(e))
    });
    await w.saveIPFS();
    r = w.ipfs(), console.log(r), progressLine("Minting NFT... <b>Please confirm the NFT-minting transaction through your wallet</b>"), n = await mintToken(u, r);
    return n
}
async function mintToken(e, r) {
    e = window.web3_bsc.eth.abi.encodeFunctionCall({
        name: "mintToken",
        type: "function",
        inputs: [{
            type: "address",
            name: "rewardWallet"
        }, {
            type: "string",
            name: "tokenURI"
        }]
    }, [e, r]), r = {
        to: window.NFT_CONTRACT_ADDRESS,
        from: window.ethereum.selectedAddress,
        data: e
    };
    return await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [r]
    })
}

function progressLine(e) {
    $("#sectionProgress").html($("#sectionProgress").html() + e + "<br>")
}
window.in_progress = !1, window.user = Moralis.User.current(), setInterval(update_loggedin, 500);