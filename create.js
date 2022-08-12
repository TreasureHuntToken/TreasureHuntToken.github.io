
window.in_progress = false;

function update_loggedin() {
    if (!window.in_progress) {
        if (window.user) {
            $("#formMustLogin").css("display", "none");
            $("#formCreatePuzzle").css("display", "");
        } else {
            $("#formMustLogin").css("display", "");
            $("#formCreatePuzzle").css("display", "none");
        }
    }
}

window.user = Moralis.User.current();
setInterval(update_loggedin, 500);

function swal_error(msg) {
    Swal.fire({
        icon: "error",
        title: "Error",
        text: msg
    });
}

async function create_puzzle() {
    // Read and validate user inputs
    var puzzle_title = $("#title").val().trim();
    if (puzzle_title.length < 5) {
        swal_error("Title length too short");
        return;
    }
    if (puzzle_title.length > 60) {
        swal_error("Title length must be less than 60 characters");
        return;
    }

    var puzzle_desc = $("#desc").val().trim();
    if (puzzle_desc.length < 2) {
        swal_error("Must have a puzzle description");
        return;
    }
    if (puzzle_desc.length > 5000) {
        swal_error("Title length must be less than 5000 characters");
        return;
    }

    var puzzle_soln = $("#soln").val().trim();
    if (puzzle_soln.length < 4) {
        swal_error("Must have a puzzle solution of at least 4 characters");
        return;
    }
    if (puzzle_soln.length > 5000) {
        swal_error("Solution length must be less than 5000 characters");
        return;
    }

    var puzzle_creator = $("#creator").val().trim();
    if (puzzle_creator.length < 1) {
        swal_error("Must provide a puzzle creator name");
        return;
    }
    if (puzzle_creator.length > 40) {
        swal_error("Puzzle creator must be less than 40 characters");
        return;
    }


    var reward = parseFloat($("#puzzleReward").val());
    if (!isFinite(reward)) {
        swal_error("Invalid reward");
        return;
    }

    if (!((reward > 0.00001) && (reward < 100000))) {
        swal_error("Reward must be between 0.00001 and 100000 BNB");
        return;
    }

    var puzzle_art = $("#puzzleArt")[0].files;
    if (puzzle_art.length == 0) {
        swal_error("Puzzle art is required");
        return;
    }

    puzzle_art = puzzle_art[0];
    if (!["image/gif", "image/jpeg", "image/png"].includes(puzzle_art.type)) {
        swal_error("Puzzle art must be in PNG, JPG, or GIF form");
        return;
    }

    var puzzle_graphic = $("#puzzleGraphic")[0].files;
    if (puzzle_graphic.length == 0) {
        swal_error("Puzzle graphic is required");
        return;
    }

    var is_unlisted = ($("input[name=puzzleVisibility]:checked").val() == "unlisted");

    puzzle_graphic = puzzle_graphic[0];
    if (!["image/gif", "image/jpeg", "image/png"].includes(puzzle_graphic.type)) {
        swal_error("Puzzle graphic must be in PNG, JPG, or GIF form");
        return;
    }

    window.in_progress = true;
    $("#formCreatePuzzle").css("display", "none");
    $("#sectionProgress").css("display", "");

    $("#sectionProgress").html("");

    progressLine("Uploading puzzle to blockchain... Please do not close this page.");

    progressLine("Uploading art...");
    var art_url = await uploadFile(puzzle_art);
    console.log(art_url);

    progressLine("Uploading graphic...");
    var graphic_url = await uploadFile(puzzle_graphic);
    console.log(graphic_url);

    progressLine("Generating reward wallet...");

    var wallet = window.web3_bsc.eth.accounts.create();

    progressLine("Reward wallet address: "+wallet.address);

    progressLine("Reward recovery key (please retain the recovery key until the puzzle creation process has completed):<br> "+btoa(JSON.stringify({"pk": wallet.privateKey})));

    progressLine("Sending reward BNB to reward wallet... <b>Please confirm the reward transaction through your wallet</b>");

    const txn = {
        to: wallet.address,
        from: window.ethereum.selectedAddress,
        value: web3_bsc.utils.toHex(Math.round(reward * (1e18))),
        data: web3_bsc.utils.toHex("creator="+puzzle_creator),
        gasLimit: 25000
    };

    const txHash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [txn],
    });

    progressLine("Reward sent: BSC transaction <a target='_blank' href='"+window.BSCSCAN+"/tx/"+txHash+"'>"+txHash+"</a>");


    var nft_name = "TreasureHunt: "+puzzle_title;
    var nft_desc = "NFT earned upon solving the TreasureHunt puzzle named '"+puzzle_title+"' - see "+window.TREASURE_HUNT_URL;

    var soln_enc = encrypt_soln(puzzle_soln, wallet.privateKey);
    console.log(soln_enc);

    var nft = await uploadNFT(
        nft_name, nft_desc,
        window.ethereum.selectedAddress,
        puzzle_title, puzzle_desc,
        art_url, graphic_url,
        soln_enc[0], soln_enc[1],
        reward, wallet.address,
        is_unlisted
    );
    console.log(nft)

    progressLine("Waiting for NFT to appear on blockchain...");

    var found;
    while (true) {
        found = await Moralis.Web3API.account.getNFTsForContract({
            chain: window.CHAIN,
            address: wallet.address,
            token_address: window.NFT_CONTRACT_ADDRESS
        });

        if (found.total > 0) break;

        console.log("Checking...");

        await sleep(6000);
    }

    var puzzle_id = found.result[0].token_id;

    try {
        await Moralis.Web3API.token.reSyncMetadata({
            chain: window.CHAIN,
            address: window.NFT_CONTRACT_ADDRESS,
            token_id: ""+puzzle_id,
            flag: "uri",
            mode: "sync",
        });
    } catch {

    }

    progressLine("Puzzle minted: BSC transaction <a href='"+window.BSCSCAN+"/tx/"+nft+"'>"+nft+"</a>");

    var puzzle_url = "puzzle.html?id="+puzzle_id;

    progressLine("<h4>Congratulations! Your puzzle has been created.</h4>")

    progressLine("<a href='"+puzzle_url+"'>Click here to view your puzzle</a>");

    progressLine("Would you like to <a href='create.html'>create another puzzle</a>?");
}

async function uploadFile(file) {
    var mFile = new Moralis.File(file.name, file);
    await mFile.saveIPFS();
    return mFile.ipfs();
}

async function uploadNFT(
    name, desc, creator_addr,
    puzzle_title, puzzle_desc,
    art_uri, puzzle_image_uri,
    solution_hash, solution_reward,
    reward_amount, reward_addr,
    unlisted
){
    const metadata = {
        "name": name,
        "description": desc,
        "image": art_uri,

        "puzzle_title": puzzle_title,
        "puzzle_description": puzzle_desc,
        "puzzle_graphic": puzzle_image_uri,
        "solution_hash": solution_hash,
        "solution_reward": solution_reward,
        "reward_amount": parseFloat(reward_amount.toFixed(4)).toString(),

        "treasurehunt": window.treasurehunt,

        "creator_addr": creator_addr,
        "reward_addr": reward_addr,
        "unlisted": unlisted || false
    }

    progressLine("Uploading metadata...")
    const metadataFile = new Moralis.File("metadata.json", {base64 : btoa(JSON.stringify(metadata))});
    await metadataFile.saveIPFS();
    const metadataURI = metadataFile.ipfs();
    console.log(metadataURI);

    progressLine("Minting NFT... <b>Please confirm the NFT-minting transaction through your wallet</b>");
    const txt = await mintToken(reward_addr, metadataURI);

    return txt
}

async function mintToken(addr, _uri){
    const encodedFunction = window.web3_bsc.eth.abi.encodeFunctionCall({
        name: "mintToken",
        type: "function",
        inputs: [{
            type: "address",
            name: "rewardWallet"
        }, {
            type: "string",
            name: "tokenURI"
        }]
    }, [addr, _uri]);

    const transactionParameters = {
        to: window.NFT_CONTRACT_ADDRESS,
        from: window.ethereum.selectedAddress,
        data: encodedFunction
    };
    const txt = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [transactionParameters]
    });
    return txt
}


function progressLine(line) {
    $("#sectionProgress").html($("#sectionProgress").html() + line + "<br>")
}

