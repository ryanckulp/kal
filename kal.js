// 아래 주소들을 원하시는 주소로 교체하세요
const STARTING = '서울특별시 마포구 월드컵북로 9길 41'; // 출발지
const ENDING = '서울특별시 영등포구 국회대로54길 10 9동 제4호 아크로타워스퀘어'; // 도착지

const data = await fetchData();
const widget = await createWidget();

widget.presentSmall();
Script.setWidget(widget);
Script.complete();

async function createWidget() {
  const colors = colorConfig();
  const widget = new ListWidget();

  // images
  const taxiImg = await getImage('taxi');
  const subwayImg = await getImage('subway');
  const kalImg = await getImage('kal');
  const knifeImg = await getImage('knife');

  widget.backgroundColor = colors.bgColor;
  widget.url = "https://seyounghan.com";
  widget.setPadding(5, 10, 15, 0);

  let headerContentStack = widget.addStack();
  headerContentStack.layoutHorizontally();
  headerContentStack.setPadding(5, 0, 0, 0);

  const brand = headerContentStack.addImage(kalImg);
  brand.imageSize = new Size(50, 20);

  headerContentStack.addSpacer();
  const logo = headerContentStack.addImage(knifeImg);
  logo.imageSize = new Size(50, 20);
  logo.rightAlignImage();

  widget.addSpacer(20);

  const contentStack = widget.addStack();
  contentStack.layoutHorizontally();

  contentStack.addSpacer();

  let leftColumn = contentStack.addStack();
  leftColumn.layoutVertically();

  contentStack.addSpacer();

  let rightColumn = contentStack.addStack();
  rightColumn.layoutVertically();

  contentStack.addSpacer();

  // left column
  leftColumn.addSpacer(4)
  addItem(subwayImg, '', '', '', leftColumn);
  leftColumn.addSpacer(12);
  addItem(taxiImg, '', '', '', leftColumn);

  // right column
  rightColumn.addSpacer(2)
  addItem('', '', `   ${data.publicTransportMins} mins`, '', rightColumn);

  rightColumn.addSpacer(2);
  const dash = rightColumn.addText("-------------");
  dash.textColor = new Color("#bfbaba")
  rightColumn.addSpacer(2);

  addItem('', data.taxiCost, `   ${data.drivingMins} mins`, '', rightColumn);

  return widget;
}

function addItem(img, description, content, link, stack) {
  const colors = colorConfig();
  const line = stack.addStack();

  line.layoutVertically();
  line.url = link;

  if (img !== '') {
    const wimg = line.addImage(img);
    wimg.imageSize = new Size(24, 24);
    wimg.tintColor = colors.tintColor;
    line.addSpacer(3);
  }

  const wname = line.addText(content);
  wname.font = Font.boldSystemFont(20);
  wname.textColor = greenOrRed(content);

  if (description !== '') {
    const wname2 = line.addText("     " + description);
    wname2.font = Font.thinRoundedSystemFont(13);
    wname2.textColor = colors.textColor;
  }
}

function greenOrRed(text) {
  let color;
  let minsInt = parseInt(text.replace(' mins'));
  let transportOptMins = [data.publicTransportMins, data.drivingMins];

  if (Math.max(...transportOptMins) == minsInt) {
    color = Color.red();
  } else {
    color = Color.green();
  }

  return color;
}

function colorConfig() {
  // general
  const tintColor = new Color('#222');

  // dark mode
  const darkBackgroud = new Color('#1A1B1E');
  const darkText = new Color('#E3E3E3');

  // light mode
  const lightBackgroud = new Color('#FFFFFF');
  const lightText = new Color('#000000');

  return {
    bgColor: Color.dynamic(lightBackgroud, darkBackgroud),
    textColor: Color.dynamic(lightText, darkText),
    tintColor: tintColor
  };
}

function mapAuthHeaders() {
  return {'Authorization': 'KakaoAK 82e1e3238c712e3be410e7a5f5b35bee'};
}

async function fetchData() {
  // 1. fetch lat/lon of addresses
  let startAddressUrl = `https://dapi.kakao.com/v2/local/search/address?query=${encodeURIComponent(STARTING)}`
  let startAddressReq = new Request(startAddressUrl)
  startAddressReq.headers = mapAuthHeaders();
  let startAddressData = await startAddressReq.loadJSON();
  let startAddrXCoord = startAddressData.documents[0].x;
  let startAddrYCoord = startAddressData.documents[0].y;

  let endAddressUrl = `https://dapi.kakao.com/v2/local/search/address?query=${encodeURIComponent(ENDING)}`
  let endAddressReq = new Request(endAddressUrl)
  endAddressReq.headers = mapAuthHeaders();
  let endAddressData = await endAddressReq.loadJSON();
  let endAddrXCoord = endAddressData.documents[0].x;
  let endAddrYCoord = endAddressData.documents[0].y;

  // 2. convert coordinates to admin values
  let startAddressCoordUrl = `https://dapi.kakao.com/v2/local/geo/transcoord?x=${startAddrXCoord}&y=${startAddrYCoord}&output_coord=WCONGNAMUL`
  let startAddressCoordReq = new Request(startAddressCoordUrl);
  startAddressCoordReq.headers = mapAuthHeaders();
  let startAddrCoordData = await startAddressCoordReq.loadJSON();
  let sX = startAddrCoordData.documents[0].x;
  let sY = startAddrCoordData.documents[0].y;

  let endAddressCoordUrl = `https://dapi.kakao.com/v2/local/geo/transcoord?x=${endAddrXCoord}&y=${endAddrYCoord}&output_coord=WCONGNAMUL`
  let endAddressCoordReq = new Request(endAddressCoordUrl);
  endAddressCoordReq.headers = mapAuthHeaders();
  let endAddrCoordData = await endAddressCoordReq.loadJSON();
  let eX = endAddrCoordData.documents[0].x;
  let eY = endAddrCoordData.documents[0].y;

  // public transport data (hidden endpoint via web UI, not authenticated API)
  let publicTransportUrl = `https://map.kakao.com/route/pubtrans.json?inputCoordSystem=WCONGNAMUL&outputCoordSystem=WCONGNAMUL&service=map.daum.net&sX=${sX}&sY=${sY}&sName=${encodeURIComponent(STARTING)}&eX=${eX}&eY=${eY}&eName=${encodeURIComponent(ENDING)}` // REMOVED params: &sid='J146537249', &eid='SES2631'
  let publicTransportData = await new Request(publicTransportUrl).loadJSON();

  let publicTransportMins = publicTransportData.in_local.routes[0].time.value / 60;

  // driving data (hidden endpoint via web UI, not authenticated API)
  let drivingTransportUrl = `https://map.kakao.com/route/carset.json?roadside=ON&sp=${sX},${sY},${encodeURIComponent(STARTING)}&ep=${eX},${eY},${encodeURIComponent(ENDING)}&carMode=SHORTEST_REALTIME&carOption=NONE`
  let drivingTransportData = await new Request(drivingTransportUrl).loadJSON();

  let drivingTransportMins = drivingTransportData.list[0].expectedTime / 60;
  let taxiCost = drivingTransportData.list[0].expectedTaxiCost;

  return {
    drivingMins: Math.round(drivingTransportMins),
    taxiCost: Number(taxiCost).toLocaleString() + '원',
    publicTransportMins: Math.round(publicTransportMins),
  };
}

async function getImage(name) {
  let fm = FileManager.local()
  let dir = fm.documentsDirectory()
  let path = fm.joinPath(dir, name)

  if (fm.fileExists(path)) {
    return fm.readImage(path)
  } else {
    let data = '';
    switch (name) {
      case 'kal':
        data =
          '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';
          break;
      case 'knife':
        data =
          'iVBORw0KGgoAAAANSUhEUgAAADAAAAAxCAYAAACcXioiAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJASURBVHgB1ZqBUeMwEEUf18Clg9sSKMElcBUcHRwdyB1AB6aDlBA6IB04VAAdBGuiDJmQsb6dtWzezE7CjJC+pN3Vys4Ny8Q6q9L3j862ne34AVSdbTrbX7BXvia1SAKXhZ9bYIGo4o/2wIK4Y5j4aO8c4mR2jIOY/Qh7Ymass5Zx4vfpf2dlTd5N6kyb2QhogWr0u9gs/Ccvvk5tt/TvUHGMvPh1apvbpYbCGPmgbVM7ZZcqCtPnDqe53cin1uIp9JH8isYDzdB2aUVBAnrQ5lLr0cWKcUtefJPaKhO9oyBG3h2ir6/Q6qGagqzQy4RGaLumMM9o4hUr7vcBP/H70uLH1PZ9VvTiYoyv7S+ZdFj9wgfjcBnvO2B2nf1Ff7rwh4IHVu4AOvXl+Nmi7UKRAA6CkHNfjiv7hD6JWyZiSG1/iRp9Eu6YMLByAMXMpQS/6y4Yem2v9pebQIUjam2vkiu3XV1Ire1VgtDfPU4og9XoKEnA7fZVCYM1enf8E/prccLwveqp4g0HlNp+yGABLfe7pc1nx8GUBBDNrQpVVqsW+jHyqXdIfxJKba9kCPWkdRVvwqBboY8NmnB38S3jgzYGfWDY5eYeR5RVM3yEx4VwLdKCMOjDmej49xBXOXVBwxHlWH9Nghuuez3k/nDWrhAzxOKkKybgmtVU7Pi+a5JLegWTim+Y+GKuPEEes+INE17Gz2nxEb5hQlfpI67UmEm8J9HHV6LFuTn5bhziIU7mN98F7dLnW/r+wgJ+w/MJ62xWem5NyhYAAAAASUVORK5CYII=';
          break;
      case 'taxi':
        data =
          'iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAYAAACohjseAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAI7SURBVHgB7ZnvbYMwEMVf0w5AJqhHyAjuBF2BEbJBskG6QdIJ2k4AGySdwNkg3YDaEkQU+T8GG8pPel+cYN0zhzkfwHCcuCpLHTEQK8ycxeDUmb3BJ/ixqaXjGfYQrtzwnytXiQHJuHZcN9jvjqHF6hgIArOpJ68SEQtpkiDuXVPphkAmGYAqUTH0JAdQJa5cZ+ABegouKhn/5tpz/WAcxAZ3gDwlS64XeECgTosM45NB/bh4xZPDIyUGZgt5TFt4UCgmI4hHBnlMBRwhoSYaANXCS9NUVYtSxfg74vOlGM/hQIrp2dA7TUnfCUbAOk1lKUohJ4X0bOiVpimnZ4N3mhLfCyNglabdA++rYrI1Bux8ebJWjOdcb91B4foDYYrfFHRE505eEg/YR0VjLk880D7KH6E+hsyBTJwHK8yYpfE7dWwMirbEpVYqXOHQBNbtQuKF2X6fEK4z4u2KYpHbHXUR295wjfKHPeRkkUwyqHsvWzgaZNBDAwXtImqI6eZi8NMwWRYgYFeZOMmuW2lWQ8dY/dA2me/vstUyGaRIL0UZHFJUSNVr1DVgh9QZ6ru001ynnXTXmVRs0TFPHsIkwd/FPuiusa1FL/VkBGnQFB0EhmdzKbanzr8wWGK+lMJgSg3d0Ny9FYi39Q+lou10bm3D+zGv/Y2ewtzBFkV4jDq0DYG5bBPf7MvuIIV5ZSjiQ+EQ5/IenDqLwanTNmizO8beQYGecTKodyaGdPCOk0Be1RRI6wMNgWWcv+DvpfR14GwWAAAAAElFTkSuQmCC';
        break;
      case 'subway':
        data =
          'iVBORw0KGgoAAAANSUhEUgAAADgAAABACAYAAABP97SyAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAIMSURBVHgB7ZrddYIwGIZf7QK4Ad2gG5Te9a50AzbQDcgIblA7QUdghI4gG9jbXtFE4RzUQgJfEpOY55zXC48m38NPTDDAOAlPyVPx7HkaR3Joa9rwpJhB2jbgipAsH5ggusbpCPki1z+rG4nb8XL0RWgo5ZDc2sFi5+bqTKbw87IcygEX9+TO0UIpqYTYojXdI0xWD/yl4HlFmPwu+csbwuVZXKLihkwQJrUQbBA4KiOSGIQyTD/TOcbnsKba7UdJjnIJJwPFmGp3smAOOpnFdicL6iCx2O5ZVAaZBfTQWGr3jCUCJwr6ThT0nSjoO1HQd6Kg76gImlrtW3mKoCL4BDq5xXavuPsFb1fM1AWqKCCD/JGFiXYnrQe9Jo6ivhMFfScK+k4UbKl5XnhWOD3PfG/fs0VN6X/uVE11qkQNtX/pB8amUpkGAaP9Ux/di6N4gFlI/VPXgz8wD6l/IVhLPjO2btPxF5gMSv/HA1Ah3EFGuB23Pal0kvcazmBHjtr/ZgE7A8WteBT3oLhOPxEeO/TGlxRhbcbb458NsoWDhc5NgQGYQ0XODYOEAv5uaS6gSAq/9pB+gbD7XvxOVgAaxyJqYtD0F0Cp2CkDHabYVwlN2JTrYLAkeQu5DgbDkreU62AwJOmCXAeDZkmX5DoYNEq6JtfBoFablO3IlytMmC0YoOD5xnB928sv/AFmKFuB3nUjeQAAAABJRU5ErkJggg==';
        break;
      default:
        data = '';
        break;
    }

    let iconImage = Image.fromData(Data.fromBase64String(data));
    fm.writeImage(path, iconImage)

    return iconImage;
  }
}