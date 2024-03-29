async function update_loggedin() {
    window.user ? ($("#loginContainer").css("display", "none"),
    $("#puzzleContainer").css("display", ""),
    window.cfg && !window.loaded && (await load_puzzles(window.cfg.only_solved))) : ($("#loginContainer").css("display", ""),
    $("#puzzleContainer").css("display", ""),
    window.cfg && !window.loaded && (await load_puzzles(window.cfg.only_solved)));
}

  function make_card(e, a, t, o, i, n) {
    return (
      (o = escape_text(o)),
      (e = "" + parseInt(e)),
      a.startsWith("https://ipfs.moralis.io")
        ? `
          <div class="col">
              <div class="card grow clickable card-semiclear" onclick="window.location.href = 'puzzle.html?id=${e}';">
                  <img src="${a}" style="width: 100%; aspect-ratio: 1.5; object-fit: contain;" class="card-img-top">
                  <div class="card-body">
                      <h5 class="card-title" style="font-weight: bold;">${(t =
                        escape_text(t))}</h5>
                      ${
                        i
                          ? `<p class="card-text">Reward: ${o}<br>${
                              n
                                ? '<span style="color: rgb(180, 0, 0); font-weight: bold">(Unlisted)</span>'
                                : ""
                            }</p>`
                          : ""
                      }
                  </div>
              </div>
          </div>
      `
        : ""
    );
  }
  async function setup_load(e) {
    window.cfg = { only_solved: e };
  }
  async function load_puzzles(e) {
      if (true) {
          window.loaded = !0,
          await get_exchange_rates();
          var a = await Moralis.Web3API.token.getNFTOwners({
              chain: window.CHAIN,
              address: window.NFT_CONTRACT_ADDRESS,
              disable_total: false
          })
            , t = [];
          console.log(a);
          for (var o = 0; o < a.total; o++)
              try {
                  (n = a.result[o]).token_uri || await Moralis.Web3API.token.reSyncMetadata({
                      chain: window.CHAIN,
                      address: window.NFT_CONTRACT_ADDRESS,
                      token_id: n.token_id,
                      flag: "uri",
                      mode: "sync"
                  }),
                  n.metadata || (n.metadata = JSON.stringify(await $.get(n.token_uri))),
                  r = JSON.parse(n.metadata),
                  t.push(r.reward_addr.toLowerCase())
              } catch {}
          console.log(t);
          var i = await get_values(t);
          console.log(i),
          $("#puzzleDiv").html("");
          for (o = 0; o < a.total; o++)
              try {
                  var n = a.result[o]
                    , r = JSON.parse(n.metadata)
                    , d = r.reward_addr.toLowerCase() != n.owner_of.toLowerCase()
                    , s = !1;
                  if (e) {
                      if (!d)
                          continue
                  } else {
                      if (d)
                          continue;
                      if (r.unlisted) {
                          try {
                              if (r.creator_addr.toLowerCase() != window.ethereum.selectedAddress.toLowerCase())
                                  continue
                          } catch {
                              continue
                          }
                          s = !0
                      }
                  }
                  if (r.treasurehunt != window.treasurehunt)
                      continue;
                  if (-1 != window.BLACKLIST.indexOf(n.token_id))
                      continue;
                  $("#noPuzzles").css("display", "none");
                  var l = !!(reward = parseFloat(i[r.reward_addr.toLowerCase()]))
                    , c = (reward = await format_currency(reward),
                  make_card(n.token_id, r.image, r.puzzle_title, reward, l, s));
                  $("#puzzleDiv").html($("#puzzleDiv").html() + c)
              } catch {}
          window.loaded = !0
      }
  }
  (window.user = Moralis.User.current()), setInterval(update_loggedin, 500);
  
